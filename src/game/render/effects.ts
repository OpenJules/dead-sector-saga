import type { Vec } from "../types";

export function drawCrate(ctx: CanvasRenderingContext2D, p: Vec) {
  ctx.save();
  ctx.translate(p.x, p.y);
  // pulsing glow
  const t = performance.now() / 400;
  const glow = 0.4 + 0.3 * Math.sin(t);
  ctx.shadowColor = "#e8a04a";
  ctx.shadowBlur = 20 * glow;
  // crate body
  ctx.fillStyle = "#8a5a2b";
  ctx.fillRect(-18, -18, 36, 36);
  ctx.strokeStyle = "#e8a04a";
  ctx.lineWidth = 2;
  ctx.strokeRect(-18, -18, 36, 36);
  // metal bands
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(18, 0);
  ctx.moveTo(0, -18);
  ctx.lineTo(0, 18);
  ctx.stroke();
  ctx.restore();
  // pickup ring
  ctx.strokeStyle = "rgba(232,160,74,0.35)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.arc(p.x, p.y, 55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}
