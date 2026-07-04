import type { GameState, Zombie, Boss, Weapon } from "../types";
import { PLAYER_RADIUS } from "../constants";

export function drawPlayer(ctx: CanvasRenderingContext2D, s: GameState) {
  const p = s.player.pos;
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 8, PLAYER_RADIUS, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // body
  ctx.fillStyle = s.player.invuln > 0 ? "#ffffff" : "#d8a24a";
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.stroke();
  // gun
  const w = s.player.inventory[s.player.weaponIndex].weapon;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(s.player.aim);
  ctx.fillStyle = w.color;
  ctx.fillRect(6, -3, 22, 6);
  ctx.restore();
}

export function drawZombie(ctx: CanvasRenderingContext2D, z: Zombie) {
  const color = z.kind === "brute" ? "#5a2a5a" : z.kind === "runner" ? "#3a6a3a" : "#4a5a3a";
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(z.pos.x, z.pos.y, z.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.stroke();
  // eyes
  ctx.fillStyle = "#ff3a3a";
  ctx.fillRect(z.pos.x - 5, z.pos.y - 3, 3, 3);
  ctx.fillRect(z.pos.x + 2, z.pos.y - 3, 3, 3);
  // hp bar
  if (z.hp < z.maxHp) {
    ctx.fillStyle = "#000";
    ctx.fillRect(z.pos.x - z.radius, z.pos.y - z.radius - 8, z.radius * 2, 4);
    ctx.fillStyle = "#c33";
    ctx.fillRect(z.pos.x - z.radius, z.pos.y - z.radius - 8, z.radius * 2 * (z.hp / z.maxHp), 4);
  }
}

export function drawBoss(ctx: CanvasRenderingContext2D, b: Boss) {
  ctx.save();
  ctx.translate(b.pos.x, b.pos.y);
  const pulse = 1 + Math.sin(performance.now() / 200) * 0.05;
  ctx.rotate(performance.now() / 800);
  ctx.fillStyle =
    b.invulnTimer > 0 ? "#eee" : b.phase === 3 ? "#3a0a3a" : b.phase === 2 ? "#3a1a1a" : "#2a1010";
  ctx.strokeStyle = "#ff2a2a";
  ctx.lineWidth = 4;
  // spiky body
  ctx.beginPath();
  const spikes = 10;
  for (let i = 0; i < spikes * 2; i++) {
    const r = (i % 2 === 0 ? b.radius * 1.3 : b.radius * 0.85) * pulse;
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const x = Math.cos(a) * r,
      y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // eye
  ctx.fillStyle = "#ffcc33";
  ctx.beginPath();
  ctx.arc(b.pos.x, b.pos.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(b.pos.x, b.pos.y, 4, 0, Math.PI * 2);
  ctx.fill();
}
