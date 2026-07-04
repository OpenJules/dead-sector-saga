import type { GameState } from "../types";
import { WORLD_W, WORLD_H, ARENA_W, ARENA_H } from "../constants";

export function drawGround(ctx: CanvasRenderingContext2D, s: GameState) {
  const step = 60;
  ctx.strokeStyle = s.inArena ? "rgba(140,40,40,0.15)" : "rgba(120,90,60,0.15)";
  ctx.lineWidth = 1;
  const startX = Math.floor(s.camera.x / step) * step;
  const startY = Math.floor(s.camera.y / step) * step;
  for (let x = startX; x < s.camera.x + 2000; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, s.camera.y - 100);
    ctx.lineTo(x, s.camera.y + 1400);
    ctx.stroke();
  }
  for (let y = startY; y < s.camera.y + 1500; y += step) {
    ctx.beginPath();
    ctx.moveTo(s.camera.x - 100, y);
    ctx.lineTo(s.camera.x + 2400, y);
    ctx.stroke();
  }
}

export function drawArena(ctx: CanvasRenderingContext2D, _s: GameState) {
  const x = (WORLD_W - ARENA_W) / 2,
    y = (WORLD_H - ARENA_H) / 2;
  ctx.fillStyle = "#1a0a0c";
  ctx.fillRect(x, y, ARENA_W, ARENA_H);
  ctx.strokeStyle = "rgba(255,80,80,0.4)";
  ctx.lineWidth = 6;
  ctx.strokeRect(x + 20, y + 20, ARENA_W - 40, ARENA_H - 40);
  ctx.strokeStyle = "rgba(255,80,80,0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + ARENA_W / 2, y + ARENA_H / 2, 200, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + ARENA_W / 2, y + ARENA_H / 2, 320, 0, Math.PI * 2);
  ctx.stroke();
}
