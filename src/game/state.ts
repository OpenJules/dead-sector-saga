import type { GameState, MapId } from "./types";
import { WEAPONS } from "./constants";
import { getMapConfig } from "./maps";
import { makeSlot } from "./utils";

export function createInitialState(mapId: MapId = "outpost"): GameState {
  const map = getMapConfig(mapId);
  
  const player = {
    pos: { x: map.playerStart.x, y: map.playerStart.y },
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
    stations: map.stations.map((s) => ({
      pos: { x: s.x, y: s.y },
      weapon: WEAPONS[s.wx],
      label: s.label,
    })),
    npcs: [],
    worldObjects: map.worldObjects.map((o) => ({
      ...o,
      pos: { ...o.pos },
      active: true,
      locked: false,
    })),
    gate: { x: map.gatePos.x, y: map.gatePos.y },
    mainQuest: map.mainQuest.map((q) => ({ ...q })),
    sideQuests: map.sideQuests.map((q) => ({ ...q, steps: q.steps.map((s) => ({ ...s })) })),
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
    selectedMap: mapId,
    powerOn: !map.hasDarkness,
    flashlightOn: map.hasFlashlight,
    generator: map.hasGenerator && map.generatorPos
      ? { pos: { x: map.generatorPos.x, y: map.generatorPos.y }, active: false, interacted: false }
      : null,
    labKeysFound: 0,
    easterEggType: map.easterEggType,
    miniBoss: null,
    hasGeneratorKey: false,
    soulBoxComplete: false,
  };
}
