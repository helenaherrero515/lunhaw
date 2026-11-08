/**
 * Map pin artwork: a glossy 3D-style teardrop pin with a soft ground shadow, holding a shaded tree (parks)
 * or a stack of books (libraries). Drawn once on a canvas and handed to MapLibre as an image.
 *
 * All sizes are CSS pixels; the canvas is drawn at RATIO for sharp edges on high-density screens.
 */
export type PinType = "park" | "lib";

export const PIN_RATIO = 3;

export interface PinArt {
  image: ImageData;
  /** Transparent space below the pin tip (for the ground shadow), in CSS px. Offset the icon down by this. */
  padBottom: number;
  /** Height of the pin head's centre above the tip, in CSS px (for placing labels). */
  headAboveTip: number;
}

const PALETTE: Record<PinType, { hi: string; base: string; low: string; ring: string }> = {
  park: { hi: "#8FE36A", base: "#3D9A2E", low: "#1E5A22", ring: "#245C43" },
  lib: { hi: "#FFD98A", base: "#E9A11B", low: "#94590A", ring: "#8A5206" },
};

type Ctx = CanvasRenderingContext2D;

function radial(ctx: Ctx, x: number, y: number, r: number, stops: [number, string][]) {
  const g = ctx.createRadialGradient(x, y, r * 0.05, x, y, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function linear(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

/** Teardrop outline: a circle of radius r at (cx, cy) tapering to a tip `tail` px below the circle. */
function teardrop(ctx: Ctx, cx: number, cy: number, r: number, tail: number) {
  const tipY = cy + r + tail;
  const d = tipY - cy;
  const a = Math.acos(r / d); // angle between the downward axis and the tangent points
  const left = Math.PI / 2 + a;
  const right = Math.PI / 2 - a;
  ctx.beginPath();
  ctx.moveTo(cx, tipY);
  ctx.lineTo(cx + r * Math.cos(left), cy + r * Math.sin(left));
  ctx.arc(cx, cy, r, left, right + Math.PI * 2, false);
  ctx.closePath();
}

function drawTree(ctx: Ctx, cx: number, cy: number, s: number) {
  // Grass mound
  ctx.fillStyle = radial(ctx, cx, cy + 0.62 * s, 0.6 * s, [[0, "#BFEA9C"], [1, "rgba(191,234,156,0)"]]);
  ctx.beginPath();
  ctx.ellipse(cx, cy + 0.62 * s, 0.55 * s, 0.14 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // Trunk with a rounded, shaded look
  ctx.fillStyle = linear(ctx, cx - 0.1 * s, 0, cx + 0.1 * s, 0, [[0, "#A06A35"], [0.55, "#7A4A20"], [1, "#4E2E12"]]);
  ctx.beginPath();
  ctx.moveTo(cx - 0.09 * s, cy + 0.62 * s);
  ctx.lineTo(cx - 0.06 * s, cy + 0.1 * s);
  ctx.lineTo(cx + 0.06 * s, cy + 0.1 * s);
  ctx.lineTo(cx + 0.09 * s, cy + 0.62 * s);
  ctx.closePath();
  ctx.fill();
  // Canopy: three shaded balls, back to front, lit from the upper left
  const ball = (x: number, y: number, r: number, dark: string) => {
    ctx.fillStyle = radial(ctx, x - 0.35 * r, y - 0.4 * r, 1.35 * r, [[0, "#C8F59A"], [0.35, "#6CC24A"], [0.75, "#3A8F2C"], [1, dark]]);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  ball(cx - 0.27 * s, cy + 0.02 * s, 0.3 * s, "#21601F");
  ball(cx + 0.28 * s, cy + 0.04 * s, 0.29 * s, "#1D561C");
  ball(cx, cy - 0.24 * s, 0.38 * s, "#246B22");
  // Specular glint
  ctx.fillStyle = "rgba(255,255,255,.45)";
  ctx.beginPath();
  ctx.ellipse(cx - 0.12 * s, cy - 0.4 * s, 0.12 * s, 0.07 * s, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawBooks(ctx: Ctx, cx: number, cy: number, s: number) {
  // Three books lying in a stack, seen slightly from above: front cover face + top face + page edge.
  const books: [number, number, string, string][] = [
    // [x offset, width, cover colour, darker spine]
    [-0.02, 1.02, "#2F8F3A", "#1D5E25"],
    [0.06, 0.92, "#3B73C4", "#244F8F"],
    [-0.04, 0.84, "#E0574E", "#A3322C"],
  ];
  const h = 0.2 * s; // front face height of one book
  const depth = 0.13 * s; // visible top face depth
  let base = cy + 0.5 * s;
  // Contact shadow
  ctx.fillStyle = "rgba(16,38,26,.22)";
  ctx.beginPath();
  ctx.ellipse(cx, base + 0.04 * s, 0.56 * s, 0.07 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  books.forEach(([dx, w, cover, spine], i) => {
    const x0 = cx + dx * s - (w * s) / 2;
    const x1 = x0 + w * s;
    const y1 = base;
    const y0 = base - h;
    // Front face (cover edge + spine band)
    ctx.fillStyle = linear(ctx, 0, y0, 0, y1, [[0, cover], [1, spine]]);
    ctx.fillRect(x0, y0, w * s, h);
    // Page block on the right end
    ctx.fillStyle = linear(ctx, 0, y0, 0, y1, [[0, "#FFFDF4"], [1, "#E9E2CC"]]);
    ctx.fillRect(x1 - 0.12 * s, y0 + 0.03 * s, 0.1 * s, h - 0.06 * s);
    ctx.strokeStyle = "rgba(150,140,110,.55)";
    ctx.lineWidth = Math.max(0.6, 0.012 * s);
    for (let k = 1; k <= 3; k++) {
      const yy = y0 + 0.03 * s + (k * (h - 0.06 * s)) / 4;
      ctx.beginPath();
      ctx.moveTo(x1 - 0.12 * s, yy);
      ctx.lineTo(x1 - 0.02 * s, yy);
      ctx.stroke();
    }
    // Spine stripe
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.fillRect(x0 + 0.1 * s, y0 + h * 0.4, 0.3 * w * s, h * 0.16);
    // Top face (only the top book shows its full cover)
    if (i === books.length - 1) {
      ctx.fillStyle = linear(ctx, 0, y0 - depth, 0, y0, [[0, "#F2867E"], [1, cover]]);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + 0.08 * s, y0 - depth);
      ctx.lineTo(x1 + 0.08 * s, y0 - depth);
      ctx.lineTo(x1, y0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.beginPath();
      ctx.ellipse(x0 + 0.3 * s, y0 - depth * 0.55, 0.16 * s, 0.03 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Edge highlight
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.fillRect(x0, y0, w * s, Math.max(0.6, 0.02 * s));
    base -= h;
  });
}

/** Draws a pin. `selected` pins are larger, darker and ringed. */
export function drawPin(type: PinType, selected: boolean): PinArt {
  const R = selected ? 21 : 17; // head radius
  const tail = selected ? 13 : 11;
  const pad = selected ? 9 : 6; // room for glow / shadow
  const padBottom = 6;
  const W = Math.ceil(2 * (R + pad));
  const H = Math.ceil(pad + 2 * R + tail + padBottom);
  const canvas = document.createElement("canvas");
  canvas.width = W * PIN_RATIO;
  canvas.height = H * PIN_RATIO;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(PIN_RATIO, PIN_RATIO);
  const cx = W / 2;
  const cy = pad + R;
  const tipY = cy + R + tail;
  const p = PALETTE[type];

  // Ground shadow
  ctx.save();
  ctx.filter = "blur(2px)";
  ctx.fillStyle = "rgba(16,38,26,.38)";
  ctx.beginPath();
  ctx.ellipse(cx, tipY, R * 0.62, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Selection halo
  if (selected) {
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.beginPath();
    ctx.arc(cx, cy, R + 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = p.ring;
    ctx.stroke();
  }

  // Pin body: shaded teardrop with a darker underside
  ctx.save();
  ctx.shadowColor = "rgba(16,38,26,.35)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  teardrop(ctx, cx, cy, R, tail);
  ctx.fillStyle = radial(ctx, cx - R * 0.45, cy - R * 0.55, R * 2.3, [[0, p.hi], [0.45, p.base], [1, p.low]]);
  ctx.fill();
  ctx.restore();
  teardrop(ctx, cx, cy, R, tail);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#FFFFFF";
  ctx.stroke();

  // Inset medallion
  const r2 = R * 0.76;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.28)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = radial(ctx, cx - r2 * 0.3, cy - r2 * 0.4, r2 * 1.6, [[0, "#FFFFFF"], [0.7, "#F2F8EC"], [1, "#DCE9D3"]]);
  ctx.beginPath();
  ctx.arc(cx, cy, r2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Icon, clipped to the medallion
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r2 - 0.5, 0, Math.PI * 2);
  ctx.clip();
  if (type === "park") drawTree(ctx, cx, cy + r2 * 0.02, r2 * 1.15);
  else drawBooks(ctx, cx, cy + r2 * 0.04, r2 * 1.22);
  ctx.restore();

  // Gloss on the pin head
  ctx.fillStyle = linear(ctx, 0, cy - R, 0, cy - R * 0.35, [[0, "rgba(255,255,255,.55)"], [1, "rgba(255,255,255,0)"]]);
  ctx.beginPath();
  ctx.ellipse(cx - R * 0.18, cy - R * 0.62, R * 0.55, R * 0.26, -0.25, 0, Math.PI * 2);
  ctx.fill();

  return { image: ctx.getImageData(0, 0, canvas.width, canvas.height), padBottom, headAboveTip: R + tail };
}
