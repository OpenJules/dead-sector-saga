import type { GameState } from "../types";
import { WORLD_W, WORLD_H, ARENA_W, ARENA_H, getWorldWidth, getWorldHeight, getArenaWidth, getArenaHeight } from "../constants";

export function drawGround(ctx: CanvasRenderingContext2D, s: GameState) {
  const worldW = getWorldWidth(s.selectedMap);
  const worldH = getWorldHeight(s.selectedMap);
  
  if (s.selectedMap === "hospital") {
    // Hospital tile pattern
    const step = 40;
    ctx.strokeStyle = "rgba(80,80,100,0.15)";
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
    
    // Blood stains (subtle)
    ctx.fillStyle = "rgba(100, 20, 20, 0.1)";
    ctx.beginPath();
    ctx.ellipse(400, 600, 30, 20, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1200, 800, 25, 15, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1600, 400, 20, 25, 0.8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Outpost grid pattern
    const step = 60;
    ctx.strokeStyle = "rgba(120,90,60,0.15)";
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
}

export function drawArena(ctx: CanvasRenderingContext2D, s: GameState) {
  const worldW = getWorldWidth(s.selectedMap);
  const worldH = getWorldHeight(s.selectedMap);
  const arenaW = getArenaWidth(s.selectedMap);
  const arenaH = getArenaHeight(s.selectedMap);
  
  const x = (worldW - arenaW) / 2;
  const y = (worldH - arenaH) / 2;
  
  if (s.selectedMap === "hospital") {
    // Hospital operating theater
    ctx.fillStyle = "#1a1a2a";
    ctx.fillRect(x, y, arenaW, arenaH);
    
    // Medical cross pattern
    ctx.strokeStyle = "rgba(100, 100, 150, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + arenaW / 2, y + 50);
    ctx.lineTo(x + arenaW / 2, y + arenaH - 50);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 50, y + arenaH / 2);
    ctx.lineTo(x + arenaW - 50, y + arenaH / 2);
    ctx.stroke();
    
    // Operating table in center
    ctx.fillStyle = "#2a2a3a";
    ctx.fillRect(x + arenaW / 2 - 40, y + arenaH / 2 - 20, 80, 40);
    ctx.strokeStyle = "rgba(150, 150, 200, 0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + arenaW / 2 - 40, y + arenaH / 2 - 20, 80, 40);
  } else {
    // Outpost underworld arena
    ctx.fillStyle = "#1a0a0c";
    ctx.fillRect(x, y, arenaW, arenaH);
    ctx.strokeStyle = "rgba(255,80,80,0.4)";
    ctx.lineWidth = 6;
    ctx.strokeRect(x + 20, y + 20, arenaW - 40, arenaH - 40);
    ctx.strokeStyle = "rgba(255,80,80,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + arenaW / 2, y + arenaH / 2, 200, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + arenaW / 2, y + arenaH / 2, 320, 0, Math.PI * 2);
    ctx.stroke();
  }
}
