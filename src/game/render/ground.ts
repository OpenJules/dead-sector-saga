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
    
    // Draw grid lines that cover the visible area
    for (let x = startX; x < s.camera.x + s.canvasWidth + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, s.camera.y);
      ctx.lineTo(x, s.camera.y + s.canvasHeight);
      ctx.stroke();
    }
    for (let y = startY; y < s.camera.y + s.canvasHeight + step; y += step) {
      ctx.beginPath();
      ctx.moveTo(s.camera.x, y);
      ctx.lineTo(s.camera.x + s.canvasWidth, y);
      ctx.stroke();
    }
    
    // Blood stains (subtle) - spread across the larger map
    ctx.fillStyle = "rgba(100, 20, 20, 0.1)";
    const bloodStains = [
      { x: 400, y: 600, rx: 30, ry: 20, rot: 0.3 },
      { x: 1200, y: 800, rx: 25, ry: 15, rot: -0.5 },
      { x: 1600, y: 400, rx: 20, ry: 25, rot: 0.8 },
      { x: 800, y: 1200, rx: 35, ry: 18, rot: 0.2 },
      { x: 2400, y: 600, rx: 28, ry: 22, rot: -0.3 },
      { x: 2000, y: 1400, rx: 32, ry: 16, rot: 0.6 },
      { x: 600, y: 1800, rx: 24, ry: 20, rot: -0.4 },
      { x: 2800, y: 1000, rx: 30, ry: 24, rot: 0.1 },
    ];
    for (const stain of bloodStains) {
      ctx.beginPath();
      ctx.ellipse(stain.x, stain.y, stain.rx, stain.ry, stain.rot, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Outpost grid pattern
    const step = 60;
    ctx.strokeStyle = "rgba(120,90,60,0.15)";
    ctx.lineWidth = 1;
    const startX = Math.floor(s.camera.x / step) * step;
    const startY = Math.floor(s.camera.y / step) * step;
    for (let x = startX; x < s.camera.x + s.canvasWidth + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, s.camera.y);
      ctx.lineTo(x, s.camera.y + s.canvasHeight);
      ctx.stroke();
    }
    for (let y = startY; y < s.camera.y + s.canvasHeight + step; y += step) {
      ctx.beginPath();
      ctx.moveTo(s.camera.x, y);
      ctx.lineTo(s.camera.x + s.canvasWidth, y);
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
    // Hospital operating theater - circular arena
    const centerX = worldW / 2;
    const centerY = worldH / 2;
    const radius = 350;
    
    // Circular floor
    ctx.fillStyle = "#1a1a2a";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Arena border
    ctx.strokeStyle = "rgba(100, 100, 150, 0.5)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner ring
    ctx.strokeStyle = "rgba(100, 100, 150, 0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    
    // Medical cross pattern (vertical + horizontal lines across circle)
    ctx.strokeStyle = "rgba(100, 100, 150, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius + 30);
    ctx.lineTo(centerX, centerY + radius - 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX - radius + 30, centerY);
    ctx.lineTo(centerX + radius - 30, centerY);
    ctx.stroke();
    
    // Operating table in center
    ctx.fillStyle = "#2a2a3a";
    ctx.fillRect(centerX - 40, centerY - 20, 80, 40);
    ctx.strokeStyle = "rgba(150, 150, 200, 0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - 40, centerY - 20, 80, 40);
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
