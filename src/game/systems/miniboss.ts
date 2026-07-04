import type { GameState, MiniBoss } from "../types";
import { pushToast, rand } from "../utils";
import { audio } from "../AudioEngine";
import { getWorldWidth, getWorldHeight } from "../constants";

const MINI_BOSS_HP = 300;
const MINI_BOSS_SPEED = 60;
const MINI_BOSS_DAMAGE = 15;
const MINI_BOSS_RADIUS = 22;
const MINI_BOSS_ATTACK_RATE = 1.5;

export function spawnMiniBoss(s: GameState) {
  const worldW = getWorldWidth(s.selectedMap);
  const worldH = getWorldHeight(s.selectedMap);
  
  s.miniBoss = {
    pos: { x: worldW / 2, y: worldH / 2 - 200 },
    hp: MINI_BOSS_HP,
    maxHp: MINI_BOSS_HP,
    speed: MINI_BOSS_SPEED,
    damage: MINI_BOSS_DAMAGE,
    radius: MINI_BOSS_RADIUS,
    attackTimer: MINI_BOSS_ATTACK_RATE,
    phase: 1,
  };
  
  pushToast(s, "The ABOMINATION has awakened!");
  audio.playMusic("boss");
}

export function updateMiniBoss(s: GameState, dt: number) {
  if (!s.miniBoss) return;
  
  const mb = s.miniBoss;
  
  // Move toward player
  const dx = s.player.pos.x - mb.pos.x;
  const dy = s.player.pos.y - mb.pos.y;
  const d = Math.hypot(dx, dy) || 1;
  
  mb.pos.x += (dx / d) * mb.speed * dt;
  mb.pos.y += (dy / d) * mb.speed * dt;
  
  // Attack
  mb.attackTimer -= dt;
  if (mb.attackTimer <= 0 && d < 200) {
    // Spawn some bullets
    const base = Math.atan2(s.player.pos.y - mb.pos.y, s.player.pos.x - mb.pos.x);
    for (let i = -1; i <= 1; i++) {
      const a = base + i * 0.3;
      s.bullets.push({
        pos: { ...mb.pos },
        vel: { x: Math.cos(a) * 250, y: Math.sin(a) * 250 },
        damage: 10,
        life: 2,
        friendly: false,
        color: "#ff6644",
        radius: 5,
      });
    }
    mb.attackTimer = MINI_BOSS_ATTACK_RATE;
  }
  
  // Check if dead
  if (mb.hp <= 0) {
    s.miniBoss = null;
    s.hasGeneratorKey = true;
    pushToast(s, "Abomination slain! Generator Key acquired!");
    audio.playInteract();
    
    // Complete the killminiboss quest step
    const mbStep = s.mainQuest.find(q => q.type === "killminiboss" && !q.done);
    if (mbStep) {
      mbStep.done = true;
      pushToast(s, "Main step complete");
    }
  }
}

export function drawMiniBoss(ctx: CanvasRenderingContext2D, mb: MiniBoss) {
  ctx.save();
  ctx.translate(mb.pos.x, mb.pos.y);
  
  const pulse = 1 + Math.sin(performance.now() / 250) * 0.06;
  
  // Body - mutated organic mass
  ctx.fillStyle = "#5a2a2a";
  ctx.beginPath();
  const spikes = 8;
  for (let i = 0; i < spikes * 2; i++) {
    const r = (i % 2 === 0 ? mb.radius * 1.4 : mb.radius * 0.8) * pulse;
    const a = (i / (spikes * 2)) * Math.PI * 2 + performance.now() / 1000;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  
  ctx.strokeStyle = "#ff4444";
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Eyes
  ctx.fillStyle = "#ffff00";
  ctx.beginPath();
  ctx.arc(-8, -5, 4, 0, Math.PI * 2);
  ctx.arc(8, -5, 4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(-8, -5, 2, 0, Math.PI * 2);
  ctx.arc(8, -5, 2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
  
  // HP bar
  if (mb.hp < mb.maxHp) {
    ctx.fillStyle = "#000";
    ctx.fillRect(mb.pos.x - mb.radius, mb.pos.y - mb.radius - 12, mb.radius * 2, 6);
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(mb.pos.x - mb.radius, mb.pos.y - mb.radius - 12, mb.radius * 2 * (mb.hp / mb.maxHp), 6);
  }
}
