export type Vec = { x: number; y: number };

export type Weapon = {
  id: string;
  name: string;
  damage: number;
  fireRate: number; // ms between shots
  bulletSpeed: number;
  spread: number;
  bulletsPerShot: number;
  cost: number;
  color: string;
  magSize: number;
  reserveMax: number;
  reloadTime: number; // seconds
};

export type WeaponSlot = { weapon: Weapon; ammo: number; reserve: number };

export type Bullet = {
  pos: Vec;
  vel: Vec;
  damage: number;
  life: number;
  friendly: boolean;
  color: string;
  radius: number;
};

export type ZombieKind = "walker" | "runner" | "brute";

export type Zombie = {
  pos: Vec;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  kind: ZombieKind;
};

export type Station = { pos: Vec; weapon: Weapon; label: string };

export type QuestStep = {
  id: string;
  text: string;
  type: "kill" | "reach" | "buy" | "interact" | "shoot" | "soulbox" | "killminiboss" | "minigolf";
  target?: number;
  progress?: number;
  location?: Vec;
  done: boolean;
  color?: string;
};

export type SideQuest = {
  id: string;
  title: string;
  steps: QuestStep[];
  reward: number | string;
  done: boolean;
  accepted: boolean;
};

export type WorldObject = {
  pos: Vec;
  color: string;
  radius: number;
  questId: string;
  stepId: string;
  active: boolean;
  locked: boolean;
};

export type NPC = {
  pos: Vec;
  name: string;
  color: string;
  radius: number;
  sideQuestId?: string;
};

export type Phase = 0 | 1 | 2 | 3;

export type BossType = "harvester" | "hivemind";

export type Boss = {
  pos: Vec;
  hp: number;
  maxHp: number;
  phase: Phase;
  attackTimer: number;
  moveTimer: number;
  target: Vec;
  radius: number;
  invulnTimer: number;
  type?: BossType;
};

export type Particle = {
  pos: Vec;
  vel: Vec;
  life: number;
  color: string;
};

export type Toast = {
  msg: string;
  life: number;
};

export type InteractTarget = {
  kind: "station" | "npc" | "gate" | "worldobject" | "ammo-crate" | "generator";
  ref: unknown;
} | null;

export type MapId = "outpost" | "hospital";

export type MapConfig = {
  id: MapId;
  name: string;
  description: string;
  worldWidth: number;
  worldHeight: number;
  arenaWidth: number;
  arenaHeight: number;
  arenaRadius?: number;
  playerStart: Vec;
  backgroundColor: string;
  gridColor: string;
  hasDarkness: boolean;
  hasFlashlight: boolean;
  hasGenerator: boolean;
  generatorPos?: Vec;
  soulBoxPos?: Vec;
  soulBoxRadius?: number;
  soulBoxTarget?: number;
  miniBossPos?: Vec;
  stations: { wx: string; x: number; y: number; label: string }[];
  worldObjects: { pos: Vec; color: string; radius: number; questId: string; stepId: string }[];
  mainQuest: QuestStep[];
  sideQuests: SideQuest[];
  gatePos: Vec;
  bossType: "harvester" | "hivemind";
  bossHp: number;
  bossRadius: number;
  easterEggType: "rgb" | "labvault";
  miniGolf?: {
    bounds: { x: number; y: number; width: number; height: number };
    balls: { pos: Vec; holeId: number }[];
    holes: { pos: Vec; id: number }[];
    walls: { x: number; y: number; width: number; height: number }[];
  };
};

export type Generator = {
  pos: Vec;
  active: boolean;
  interacted: boolean;
};

export type HiveMindBoss = Boss & {
  type: "hivemind";
  spawnTimer: number;
  spawnCooldown: number;
  maxMinions: number;
  exposed: boolean;
  exposeTimer: number;
  exposeCooldown: number;
  orbitAngle: number;
  orbitSpeed: number;
  orbiting: boolean;
};

export type MiniBoss = {
  pos: Vec;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  attackTimer: number;
  phase: number;
};

export type GolfBall = {
  pos: Vec;
  vel: Vec;
  radius: number;
  active: boolean;
  inHole: boolean;
  holeId: number;
};

export type GolfHole = {
  pos: Vec;
  radius: number;
  id: number;
  ballInHole: boolean;
};

export type MiniGolfWall = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MiniGolfArea = {
  bounds: { x: number; y: number; width: number; height: number };
  balls: GolfBall[];
  holes: GolfHole[];
  walls: MiniGolfWall[];
  complete: boolean;
};

export type GameState = {
  keys: Record<string, boolean>;
  mouse: { x: number; y: number; down: boolean };
  player: {
    pos: Vec;
    hp: number;
    maxHp: number;
    cash: number;
    inventory: WeaponSlot[];
    weaponIndex: number;
    lastShot: number;
    aim: number;
    invuln: number;
    reloadUntil: number;
    reloadingSlot: number;
  };
  bullets: Bullet[];
  zombies: Zombie[];
  particles: Particle[];
  stations: Station[];
  npcs: NPC[];
  worldObjects: WorldObject[];
  gate: Vec;
  mainQuest: QuestStep[];
  sideQuests: SideQuest[];
  mainIndex: number;
  round: number;
  zombiesToKill: number;
  killedInRound: number;
  spawnTimer: number;
  toasts: Toast[];
  interactHint: string;
  interactTarget: InteractTarget;
  camera: Vec;
  inArena: boolean;
  boss: Boss | null;
  won: boolean;
  time: number;
  holdTimer: number;
  canvasWidth: number;
  canvasHeight: number;
  selectedMap: MapId;
  powerOn: boolean;
  flashlightOn: boolean;
  generator: Generator | null;
  labKeysFound: number;
  easterEggType: "rgb" | "labvault";
  miniBoss: MiniBoss | null;
  hasGeneratorKey: boolean;
  soulBoxComplete: boolean;
  miniGolf: MiniGolfArea | null;
};
