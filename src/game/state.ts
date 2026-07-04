import type { GameState } from "./types";
import {
  WORLD_W,
  WORLD_H,
  WEAPONS,
  MAIN_QUEST,
  SIDE_QUESTS,
  STATION_LAYOUT,
  WORLD_OBJECT_LAYOUT,
} from "./constants";
import { makeSlot } from "./utils";

export function createInitialState(): GameState {
  const player = {
    pos: { x: WORLD_W / 2 - 300, y: WORLD_H / 2 },
    hp: 100,
    maxHp: 100,
    cash: 150,
    inventory: [makeSlot(WEAPONS.pistol)],
    weaponIndex: 0,
    lastShot: 0,
    aim: 0,
    invuln: 0,
    reloadUntil: 0,
    reloadingSlot: -1,
  };

  return {
    keys: {} as Record<string, boolean>,
    mouse: { x: 0, y: 0, down: false },
    player,
    bullets: [],
    zombies: [],
    particles: [],
    stations: STATION_LAYOUT.map((s) => ({
      pos: { x: s.x, y: s.y },
      weapon: WEAPONS[s.wx],
      label: s.label,
    })),
    npcs: [],
    worldObjects: WORLD_OBJECT_LAYOUT.map((o) => ({
      ...o,
      pos: { ...o.pos },
      active: true,
      locked: false,
    })),
    gate: { x: WORLD_W / 2, y: WORLD_H / 2 },
    mainQuest: MAIN_QUEST.map((q) => ({ ...q })),
    sideQuests: SIDE_QUESTS.map((q) => ({ ...q, steps: q.steps.map((s) => ({ ...s })) })),
    mainIndex: 0,
    round: 1,
    zombiesToKill: 10,
    killedInRound: 0,
    spawnTimer: 0,
    toasts: [],
    interactHint: "",
    interactTarget: null,
    camera: { x: 0, y: 0 },
    inArena: false,
    boss: null,
    won: false,
    time: 0,
    holdTimer: 0,
    canvasWidth: 1280,
    canvasHeight: 720,
  };
}
