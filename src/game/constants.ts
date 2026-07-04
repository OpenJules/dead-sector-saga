import type { Weapon, QuestStep, SideQuest, MapId } from "./types";
import { OUTPOST_MAP } from "./maps/outpost";
import { HOSPITAL_MAP } from "./maps/hospital";

// ---------- Map Helpers ----------
export function getWorldWidth(mapId: MapId): number {
  return mapId === "hospital" ? HOSPITAL_MAP.worldWidth : OUTPOST_MAP.worldWidth;
}

export function getWorldHeight(mapId: MapId): number {
  return mapId === "hospital" ? HOSPITAL_MAP.worldHeight : OUTPOST_MAP.worldHeight;
}

export function getArenaWidth(mapId: MapId): number {
  return mapId === "hospital" ? HOSPITAL_MAP.arenaWidth : OUTPOST_MAP.arenaWidth;
}

export function getArenaHeight(mapId: MapId): number {
  return mapId === "hospital" ? HOSPITAL_MAP.arenaHeight : OUTPOST_MAP.arenaHeight;
}

export function getArenaRadius(mapId: MapId): number | undefined {
  return mapId === "hospital" ? HOSPITAL_MAP.arenaRadius : undefined;
}

// ---------- World Dimensions (Outpost defaults for backward compatibility) ----------
export const WORLD_W = 2400;
export const WORLD_H = 1800;
export const ARENA_W = 1200;
export const ARENA_H = 900;

// ---------- Player ----------
export const PLAYER_SPEED = 220;
export const PLAYER_RADIUS = 14;

// ---------- Weapons ----------
export const WEAPONS: Record<string, Weapon> = {
  pistol: {
    id: "pistol",
    name: "Rusty Pistol",
    damage: 20,
    fireRate: 320,
    bulletSpeed: 620,
    spread: 0.05,
    bulletsPerShot: 1,
    cost: 0,
    color: "#e8c56a",
    magSize: 12,
    reserveMax: 96,
    reloadTime: 1.0,
  },
  smg: {
    id: "smg",
    name: "Scavenger SMG",
    damage: 14,
    fireRate: 110,
    bulletSpeed: 720,
    spread: 0.12,
    bulletsPerShot: 1,
    cost: 400,
    color: "#7ad0ff",
    magSize: 30,
    reserveMax: 120,
    reloadTime: 1.5,
  },
  shotgun: {
    id: "shotgun",
    name: "Trench Shotgun",
    damage: 18,
    fireRate: 550,
    bulletSpeed: 700,
    spread: 0.35,
    bulletsPerShot: 6,
    cost: 800,
    color: "#ff9b5a",
    magSize: 6,
    reserveMax: 36,
    reloadTime: 2.0,
  },
  rifle: {
    id: "rifle",
    name: "Marksman Rifle",
    damage: 70,
    fireRate: 480,
    bulletSpeed: 1000,
    spread: 0.02,
    bulletsPerShot: 1,
    cost: 1400,
    color: "#ff5a5a",
    magSize: 5,
    reserveMax: 30,
    reloadTime: 2.0,
  },
  plasma: {
    id: "plasma",
    name: "Toxin Blaster",
    damage: 40,
    fireRate: 180,
    bulletSpeed: 820,
    spread: 0.06,
    bulletsPerShot: 1,
    cost: 2500,
    color: "#8bff6a",
    magSize: 20,
    reserveMax: 80,
    reloadTime: 1.8,
  },
};

// ---------- Main Quest ----------
export const MAIN_QUEST: QuestStep[] = [
  {
    id: "m1",
    text: "Hold the Outpost Radio (NW) for 10s",
    type: "reach",
    location: { x: 300, y: 300 },
    done: false,
  },
  {
    id: "m2",
    text: "Purge the horde: kill 15 zombies",
    type: "kill",
    target: 15,
    progress: 0,
    done: false,
  },
  { id: "m3", text: "Buy a new weapon at any station", type: "buy", done: false },
  {
    id: "m4",
    text: "Slay 7 zombies near the Sector Key (SE ruin)",
    type: "kill",
    target: 7,
    progress: 0,
    location: { x: 2050, y: 1500 },
    done: false,
  },
  {
    id: "m5",
    text: "Enter the Underworld Gate (center)",
    type: "reach",
    location: { x: WORLD_W / 2, y: WORLD_H / 2 },
    done: false,
  },
];

// ---------- Side Quests ----------
export const SIDE_QUESTS: SideQuest[] = [
  {
    id: "sq_lights",
    title: "The RGB Sequence",
    accepted: true,
    done: false,
    reward: "MAX_RESOURCES",
    steps: [
      {
        id: "l1",
        text: "Shoot the Red Light",
        type: "shoot",
        color: "#ff0000",
        location: { x: 400, y: 400 },
        done: false,
      },
      {
        id: "l2",
        text: "Shoot the Green Light",
        type: "shoot",
        color: "#00ff00",
        location: { x: 2000, y: 400 },
        done: false,
      },
      {
        id: "l3",
        text: "Shoot the Blue Light",
        type: "shoot",
        color: "#0000ff",
        location: { x: 1200, y: 1400 },
        done: false,
      },
    ],
  },
  {
    id: "sq_supply",
    title: "Supply Run: Recover 4 Crates",
    accepted: true,
    done: false,
    reward: 300,
    steps: [
      {
        id: "c1",
        text: "Recover crate — NW ruins",
        type: "reach",
        location: { x: 300, y: 900 },
        done: false,
      },
      {
        id: "c2",
        text: "Recover crate — NE outpost",
        type: "reach",
        location: { x: 2100, y: 900 },
        done: false,
      },
      {
        id: "c3",
        text: "Recover crate — south depot",
        type: "reach",
        location: { x: 800, y: 1500 },
        done: false,
      },
      {
        id: "c4",
        text: "Recover crate — east alley",
        type: "reach",
        location: { x: 1700, y: 1500 },
        done: false,
      },
    ],
  },
];

// ---------- Station Layout ----------
export const STATION_LAYOUT: { wx: string; x: number; y: number; label: string }[] = [
  { wx: "smg", x: 500, y: 500, label: "SMG" },
  { wx: "shotgun", x: 1900, y: 500, label: "Shotgun" },
  { wx: "rifle", x: 500, y: 1400, label: "Rifle" },
  { wx: "plasma", x: 1900, y: 1400, label: "Plasma" },
];

// ---------- World Object Layout ----------
export const WORLD_OBJECT_LAYOUT = [
  { pos: { x: 400, y: 400 }, color: "#ff0000", radius: 15, questId: "sq_lights", stepId: "l1" },
  { pos: { x: 2000, y: 400 }, color: "#00ff00", radius: 15, questId: "sq_lights", stepId: "l2" },
  { pos: { x: 1200, y: 1400 }, color: "#0000ff", radius: 15, questId: "sq_lights", stepId: "l3" },
];
