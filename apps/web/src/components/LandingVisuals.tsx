"use client";

import { useEffect } from "react";
import { initLunhawVisuals } from "@/lib/lunhaw-landing";

/** Mounts the landing page's 3D scenes + scroll effects and tears them down on unmount. */
export function LandingVisuals() {
  useEffect(() => initLunhawVisuals(), []);
  return null;
}
