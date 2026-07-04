import type { GameState, Station, NPC, Vec } from "../types";
import { WORLD_W, WORLD_H } from "../constants";
import { drawCrate } from "./effects";

export function drawStation(ctx: CanvasRenderingContext2D, st: Station, s: GameState) {
  ctx.save();
  ctx.translate(st.pos.x, st.pos.y);
  ctx.fillStyle = "#2a1f18";
  ctx.strokeStyle = st.weapon.color;
  ctx.lineWidth = 3;
  ctx.fillRect(-28, -28, 56, 56);
  ctx.strokeRect(-28, -28, 56, 56);
  ctx.fillStyle = st.weapon.color;
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(st.label.toUpperCase(), 0, -2);
  ctx.fillStyle = "#e8c56a";
  ctx.font = "10px 'JetBrains Mono', monospace";
  const owned = s.player.inventory.some((slot) => slot.weapon.id === st.weapon.id);
  ctx.fillText(owned ? "OWNED" : `$${st.weapon.cost}`, 0, 12);
  ctx.restore();
}

export function drawNpc(ctx: CanvasRenderingContext2D, n: NPC) {
  ctx.fillStyle = n.color;
  ctx.beginPath();
  ctx.arc(n.pos.x, n.pos.y, n.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#ccc";
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillText(n.name, n.pos.x, n.pos.y + 30);
}

export function drawGate(ctx: CanvasRenderingContext2D, s: GameState) {
  const p = s.gate;
  const ready = s.mainQuest.slice(0, 4).every((q) => q.done);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(s.time * 0.4);
  ctx.strokeStyle = ready ? "#ff3a3a" : "rgba(120,120,120,0.5)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 50, 0, Math.PI * 2);
  ctx.stroke();
  ctx.rotate(-s.time * 0.8);
  ctx.beginPath();
  ctx.arc(0, 0, 38, 0, Math.PI * 1.4);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = ready ? "#ff8080" : "#888";
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("UNDERWORLD GATE", p.x, p.y + 74);
}

export function drawWorldMarkers(ctx: CanvasRenderingContext2D, s: GameState) {
  // outer border
  ctx.strokeStyle = "rgba(180,110,60,0.4)";
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, WORLD_W - 80, WORLD_H - 80);

  // Quest markers
  for (let i = 0; i < s.mainQuest.length; i++) {
    const q = s.mainQuest[i];
    if (q.done || !(q.type === "reach" || (q.type === "kill" && q.location))) continue;
    if (i > 0 && !s.mainQuest[i - 1].done) continue;
    drawMarker(ctx, q.location!, "#e8c56a", "!");
  }
  for (const sq of s.sideQuests) {
    if (!sq.accepted || sq.done) continue;
    for (const st of sq.steps) {
      if (st.done || !(st.type === "reach" || (st.type === "kill" && st.location))) continue;
      if (sq.id === "sq_supply") drawCrate(ctx, st.location!);
      else drawMarker(ctx, st.location!, "#8bff6a", "?");
    }
  }
}

export function drawMarker(ctx: CanvasRenderingContext2D, p: Vec, color: string, label: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(p.x, p.y, 40, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.font = "bold 22px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, p.x, p.y);
}
