import type { GameState } from "../types";
import { PLAYER_RADIUS } from "../constants";
import { drawGround, drawArena } from "./ground";
import { drawPlayer, drawZombie, drawBoss } from "./entities";
import { drawStation, drawGate, drawWorldMarkers, drawNpc } from "./world";
import { drawCrate } from "./effects";
import { drawFlashlight, drawGenerator } from "./flashlight";
import { drawHiveMind } from "../systems/hivemind";
import { drawMiniBoss } from "../systems/miniboss";
import { drawMiniGolf } from "./minigolf";
import { getMapConfig } from "../maps";

export function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, s: GameState) {
  const cam = s.camera;
  ctx.fillStyle = s.inArena ? "#120608" : (s.selectedMap === "hospital" ? "#0a0a0f" : "#1a1310");
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  drawGround(ctx, s);

  if (s.inArena) drawArena(ctx, s);
  else drawWorldMarkers(ctx, s);

  if (s.inArena) {
    const worldW = s.selectedMap === "hospital" ? 2000 : 2400;
    const worldH = s.selectedMap === "hospital" ? 1600 : 1800;
    const cratePos = { x: worldW / 2, y: worldH / 2 };
    drawCrate(ctx, cratePos);
  }

  if (!s.inArena) {
    // Draw generator if hospital map
    if (s.selectedMap === "hospital" && s.generator) {
      drawGenerator(ctx, s);
    }
    
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

  // Draw Hold Progress for first quest (if it's a reach quest with location)
  const firstStep = s.mainQuest[0];
  if (!firstStep.done && !s.inArena && firstStep.location && firstStep.type === "reach") {
    const loc = firstStep.location;
    ctx.beginPath();
    ctx.strokeStyle = "rgba(232, 197, 106, 0.5)";
    ctx.lineWidth = 3;
    ctx.arc(loc.x, loc.y, 55, 0, (s.holdTimer / 10) * Math.PI * 2);
    ctx.stroke();
  }

  if (!s.inArena) drawGate(ctx, s);

  if (!s.inArena && s.selectedMap === "hospital") {
    drawMiniGolf(ctx, s);
  }

  for (const z of s.zombies) drawZombie(ctx, z);

  if (s.boss && s.inArena) {
    if (s.boss.type === "hivemind") {
      drawHiveMind(ctx, s.boss as any);
    } else {
      drawBoss(ctx, s.boss);
    }
  }
  
  // Mini Boss (hospital map)
  if (s.selectedMap === "hospital" && s.miniBoss && !s.inArena) {
    drawMiniBoss(ctx, s.miniBoss);
  }
  
  // Soul box indicator (hospital map)
  if (s.selectedMap === "hospital" && !s.inArena && s.generator) {
    const map = getMapConfig(s.selectedMap);
    const soulBoxStep = s.mainQuest.find(q => q.type === "soulbox" && !q.done);
    if (soulBoxStep && map.soulBoxPos && map.soulBoxRadius) {
      const pulse = 0.5 + 0.5 * Math.sin(s.time * 4);
      ctx.save();
      ctx.globalAlpha = 0.3 + 0.2 * pulse;
      ctx.strokeStyle = "#4488ff";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.lineDashOffset = s.time * 30;
      ctx.beginPath();
      ctx.arc(map.soulBoxPos.x, map.soulBoxPos.y, map.soulBoxRadius, 0, Math.PI * 2);
      ctx.stroke();
      // Glow
      ctx.globalAlpha = 0.1 + 0.08 * pulse;
      ctx.fillStyle = "#4488ff";
      ctx.fill();
      ctx.setLineDash([]);
      ctx.restore();
      // Soul box label
      ctx.fillStyle = "#4488ff";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`SOUL BOX: ${soulBoxStep.progress ?? 0}/${soulBoxStep.target}`, map.soulBoxPos.x, map.soulBoxPos.y - map.soulBoxRadius - 8);
    }
  }

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
  
  // Draw flashlight overlay (after vignette for proper layering)
  if (s.selectedMap === "hospital" && !s.powerOn && s.flashlightOn) {
    drawFlashlight(ctx, canvas, s);
  }
}
