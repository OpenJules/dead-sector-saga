import type { GameState } from "../types";
import { WORLD_W, WORLD_H, getWorldWidth, getWorldHeight } from "../constants";
import { clamp } from "../utils";

export function updateCamera(s: GameState) {
  const cw = s.canvasWidth;
  const ch = s.canvasHeight;
  const worldW = getWorldWidth(s.selectedMap);
  const worldH = getWorldHeight(s.selectedMap);
  
  s.camera.x = clamp(s.player.pos.x - cw / 2, 0, worldW - cw);
  s.camera.y = clamp(s.player.pos.y - ch / 2, 0, worldH - ch);
  if (worldW < cw) s.camera.x = (worldW - cw) / 2;
  if (worldH < ch) s.camera.y = (worldH - ch) / 2;
}
