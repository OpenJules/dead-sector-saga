import type { GameState } from "../types";
import { WORLD_W, WORLD_H } from "../constants";
import { clamp } from "../utils";

export function updateCamera(s: GameState) {
  const cw = s.canvasWidth;
  const ch = s.canvasHeight;
  s.camera.x = clamp(s.player.pos.x - cw / 2, 0, WORLD_W - cw);
  s.camera.y = clamp(s.player.pos.y - ch / 2, 0, WORLD_H - ch);
  if (WORLD_W < cw) s.camera.x = (WORLD_W - cw) / 2;
  if (WORLD_H < ch) s.camera.y = (WORLD_H - ch) / 2;
}
