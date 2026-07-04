import type { GameState } from "../types";

export function drawMiniGolf(ctx: CanvasRenderingContext2D, s: GameState) {
  if (!s.miniGolf) return;

  const mg = s.miniGolf;
  const b = mg.bounds;

  ctx.save();

  ctx.fillStyle = mg.complete ? "#1a4a1a" : "#1a3a1a";
  ctx.fillRect(b.x, b.y, b.width, b.height);

  ctx.strokeStyle = mg.complete ? "#44ff44" : "#2a6a2a";
  ctx.lineWidth = 4;
  ctx.strokeRect(b.x, b.y, b.width, b.height);

  for (const wall of mg.walls) {
    ctx.fillStyle = "#555";
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 2;
    ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
  }

  for (const hole of mg.holes) {
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(hole.pos.x, hole.pos.y, hole.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hole.ballInHole ? "#44ff44" : "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  for (const ball of mg.balls) {
    if (!ball.active) continue;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.fillStyle = mg.complete ? "#44ff44" : "#aaa";
  ctx.font = "bold 14px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    mg.complete ? "COMPLETE!" : "MINI GOLF",
    b.x + b.width / 2,
    b.y - 10
  );

  ctx.restore();
}
