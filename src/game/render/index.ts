import type { GameState } from "../types";
import { PLAYER_RADIUS } from "../constants";
import { drawGround, drawArena } from "./ground";
import { drawPlayer, drawZombie, drawBoss } from "./entities";
import { drawStation, drawGate, drawWorldMarkers, drawNpc } from "./world";
import { drawCrate } from "./effects";

export function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, s: GameState) {
  const cam = s.camera;
  ctx.fillStyle = s.inArena ? "#120608" : "#1a1310";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  drawGround(ctx, s);

  if (s.inArena) drawArena(ctx, s);
  else drawWorldMarkers(ctx, s);

  if (s.inArena) {
    const cratePos = { x: 1200, y: 900 };
    drawCrate(ctx, cratePos);
  }

  if (!s.inArena) {
    for (const st of s.stations) drawStation(ctx, st, s);
    for (const obj of s.worldObjects) {
      const sq = s.sideQuests.find((q) => q.id === obj.questId);
      const step = sq ? sq.steps.find((st) => st.id === obj.stepId) : null;
      const isActive = step && step.done;

      ctx.save();
      if (isActive) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = obj.color;
        ctx.fillStyle = obj.color;
      } else {
        ctx.fillStyle = obj.locked ? "#333" : "#666";
        if (!obj.locked) {
          ctx.strokeStyle = obj.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(obj.pos.x, obj.pos.y, obj.radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.arc(obj.pos.x, obj.pos.y, obj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  // Draw Hold Progress for Outpost Radio
  const firstStep = s.mainQuest[0];
  if (!firstStep.done && !s.inArena && firstStep.location) {
    const loc = firstStep.location;
    ctx.beginPath();
    ctx.strokeStyle = "rgba(232, 197, 106, 0.5)";
    ctx.lineWidth = 3;
    ctx.arc(loc.x, loc.y, 55, 0, (s.holdTimer / 10) * Math.PI * 2);
    ctx.stroke();
  }

  if (!s.inArena) drawGate(ctx, s);

  for (const z of s.zombies) drawZombie(ctx, z);

  if (s.boss && s.inArena) drawBoss(ctx, s.boss);

  // Bullets
  for (const b of s.bullets) {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(b.pos.x, b.pos.y);
    ctx.lineTo(b.pos.x - b.vel.x * 0.02, b.pos.y - b.vel.y * 0.02);
    ctx.stroke();
  }

  // Particles
  const clamp = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v));
  for (const p of s.particles) {
    ctx.globalAlpha = clamp(p.life * 2, 0, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.pos.x, p.pos.y, 3, 3);
  }
  ctx.globalAlpha = 1;

  drawPlayer(ctx, s);

  ctx.restore();

  // Vignette
  const g = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    canvas.height * 0.4,
    canvas.width / 2,
    canvas.height / 2,
    canvas.height * 0.9,
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
