/**
 * Client Router Interface for Lunhaw Commute & Shade Navigation
 * Ticket: C-M2-01 (F-003)
 *
 * Communicates with dedicated Web Worker (routing-worker.ts) via postMessage.
 * Offloads heavy A* transit and pedestrian pathfinding off the UI thread.
 * Provides instant fallback to direct execution for SSR and headless testing environments.
 */

import type {
  Coordinates,
  RouteOption,
  RoutePlanRequest,
  RoutePreference,
  RouteWorkerRequest,
  RouteWorkerResponse,
} from "../../types/routing";
import { generateRoutes } from "../../workers/routing-worker";

// Re-export methods for consumers
export { computeGreenIndex } from "../methods/green-index";
export { computeRouteShade } from "../methods/shade-calculator";
export { computeWalkingDuration, computeTransitFare } from "../methods/transit-math";

export interface RouterOptions {
  timeoutMs?: number;
  useFallbackDirectly?: boolean;
}

interface PendingRequest {
  resolve: (routes: RouteOption[]) => void;
  reject: (error: Error) => void;
  timer: number | NodeJS.Timeout;
}

export class ClientRouter {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private isWorkerSupported: boolean;
  private timeoutMs: number;

  constructor(options: RouterOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 5000;
    this.isWorkerSupported =
      !options.useFallbackDirectly &&
      typeof window !== "undefined" &&
      typeof Worker !== "undefined";

    if (this.isWorkerSupported) {
      this.initWorker();
    }
  }

  private initWorker(): void {
    try {
      this.worker = new Worker(
        new URL("../../workers/routing-worker.ts", import.meta.url),
        { type: "module" }
      );

      this.worker.onmessage = (event: MessageEvent<RouteWorkerResponse>) => {
        const data = event.data;
        if (!data?.id) return;

        const pending = this.pendingRequests.get(data.id);
        if (!pending) return;

        clearTimeout(pending.timer);
        this.pendingRequests.delete(data.id);

        if (data.type === "ROUTE_RESULT") {
          pending.resolve(data.payload.routes);
        } else {
          pending.reject(new Error(data.payload.error || "Routing calculation failed"));
        }
      };

      this.worker.onerror = (err) => {
        // Fall back to direct execution for pending requests
        for (const [id, pending] of this.pendingRequests.entries()) {
          clearTimeout(pending.timer);
          pending.reject(new Error(err.message || "Routing worker error"));
          this.pendingRequests.delete(id);
        }
      };
    } catch {
      // In SSR, test, or restricted CSP environments, worker init may throw
      this.worker = null;
      this.isWorkerSupported = false;
    }
  }

  /**
   * Plans multi-modal transit & shaded walking routes between origin and destination.
   */
  public async findRoutes(
    origin: Coordinates,
    destination: Coordinates,
    preference: RoutePreference = "shaded_walk"
  ): Promise<RouteOption[]> {
    const requestPayload: RoutePlanRequest = { origin, destination, preference };

    // If Worker is unavailable or disabled, execute synchronously in in-memory fallback
    if (!this.worker || !this.isWorkerSupported) {
      return generateRoutes(requestPayload);
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return new Promise<RouteOption[]>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        // Fallback on timeout instead of failing the user
        try {
          const fallbackRoutes = generateRoutes(requestPayload);
          resolve(fallbackRoutes);
        } catch (fallbackErr) {
          reject(new Error(`Routing worker timed out after ${this.timeoutMs}ms`));
        }
      }, this.timeoutMs);

      this.pendingRequests.set(requestId, { resolve, reject, timer });

      const request: RouteWorkerRequest = {
        id: requestId,
        type: "FIND_ROUTE",
        payload: requestPayload,
      };

      try {
        this.worker!.postMessage(request);
      } catch {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        // Instant fallback if postMessage fails (e.g. DataCloneError)
        resolve(generateRoutes(requestPayload));
      }
    });
  }

  /**
   * Cleanly terminates the active Web Worker instance.
   */
  public destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Router destroyed"));
    }
    this.pendingRequests.clear();
  }
}

// Global singleton instance for app-wide reuse
let defaultRouterInstance: ClientRouter | null = null;

export function getClientRouter(): ClientRouter {
  if (!defaultRouterInstance) {
    defaultRouterInstance = new ClientRouter();
  }
  return defaultRouterInstance;
}

export async function findCommuteRoutes(
  origin: Coordinates,
  destination: Coordinates,
  preference: RoutePreference = "shaded_walk"
): Promise<RouteOption[]> {
  const router = getClientRouter();
  return router.findRoutes(origin, destination, preference);
}
