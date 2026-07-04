import type { GameState, Station, NPC, Vec } from "../types";
import { WORLD_W, WORLD_H, getWorldWidth, getWorldHeight } from "../constants";
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
  const gateStep = s.mainQuest.find(q => q.id === "m5");
  const ready = gateStep ? s.mainQuest.slice(0, s.mainQuest.indexOf(gateStep)).every((q) => q.done) : false;
  
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
  
  const gateLabel = s.selectedMap === "hospital" ? "OPERATING THEATER" : "UNDERWORLD GATE";
  ctx.fillStyle = ready ? "#ff8080" : "#888";
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(gateLabel, p.x, p.y + 74);
}

export function drawWorldMarkers(ctx: CanvasRenderingContext2D, s: GameState) {
  const worldW = getWorldWidth(s.selectedMap);
  const worldH = getWorldHeight(s.selectedMap);
  
  // outer border
  ctx.strokeStyle = s.selectedMap === "hospital" 
    ? "rgba(100,100,150,0.4)" 
    : "rgba(180,110,60,0.4)";
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, worldW - 80, worldH - 80);

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
      if (sq.id === "sq_supply" || sq.id === "sq_supplies") drawCrate(ctx, st.location!);
      else drawMarker(ctx, st.location!, "#8bff6a", "?");
    }
  }
  
  // Draw vault for hospital map
  if (s.selectedMap === "hospital") {
    const vaultPos = { x: 300, y: 300 };
    const vaultQuest = s.sideQuests.find(q => q.id === "sq_labvault");
    const allKeysFound = s.labKeysFound >= 3;
    
    ctx.save();
    ctx.translate(vaultPos.x, vaultPos.y);
    
    // Vault door
    ctx.fillStyle = allKeysFound ? "#4a6a4a" : "#3a3a4a";
    ctx.fillRect(-40, -30, 80, 60);
    
    // Border
    ctx.strokeStyle = allKeysFound ? "#6a8a6a" : "#5a5a6a";
    ctx.lineWidth = 3;
    ctx.strokeRect(-40, -30, 80, 60);
    
    // Lock indicator
    ctx.fillStyle = allKeysFound ? "#00ff00" : "#ff0000";
    ctx.beginPath();
    ctx.arc(25, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Label
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("VAULT", 0, 5);
    
    ctx.restore();
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
