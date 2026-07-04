import { useEffect, useRef, useState, useCallback } from "react";
import { audio } from "./AudioEngine";


// ---------- Types ----------
type Vec = { x: number; y: number };
type Weapon = {
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
type WeaponSlot = { weapon: Weapon; ammo: number; reserve: number };
type Bullet = { pos: Vec; vel: Vec; damage: number; life: number; friendly: boolean; color: string; radius: number };
type Zombie = { pos: Vec; hp: number; maxHp: number; speed: number; damage: number; radius: number; kind: "walker" | "runner" | "brute" };
type Station = { pos: Vec; weapon: Weapon; label: string };
type QuestStep = { id: string; text: string; type: "kill" | "reach" | "buy" | "interact" | "shoot"; target?: number; progress?: number; location?: Vec; done: boolean; color?: string };
type SideQuest = { id: string; title: string; steps: QuestStep[]; reward: number | string; done: boolean; accepted: boolean };
type WorldObject = { pos: Vec; color: string; radius: number; questId: string; stepId: string; active: boolean; locked: boolean };
type NPC = { pos: Vec; name: string; color: string; radius: number; sideQuestId?: string };
type Phase = 0 | 1 | 2 | 3;
type Boss = {
  pos: Vec;
  hp: number;
  maxHp: number;
  phase: Phase;
  attackTimer: number;
  moveTimer: number;
  target: Vec;
  radius: number;
  invulnTimer: number;
};

// ---------- Constants ----------
const WORLD_W = 2400;
const WORLD_H = 1800;
const ARENA_W = 1200;
const ARENA_H = 900;
const PLAYER_SPEED = 220;
const PLAYER_RADIUS = 14;

const WEAPONS: Record<string, Weapon> = {
  pistol:   { id: "pistol",   name: "Rusty Pistol",  damage: 20, fireRate: 320, bulletSpeed: 620, spread: 0.05, bulletsPerShot: 1, cost: 0,    color: "#e8c56a", magSize: 12, reserveMax: 96,  reloadTime: 1.0 },
  smg:      { id: "smg",      name: "Scavenger SMG", damage: 14, fireRate: 110, bulletSpeed: 720, spread: 0.12, bulletsPerShot: 1, cost: 400,  color: "#7ad0ff", magSize: 30, reserveMax: 120, reloadTime: 1.5 },
  shotgun:  { id: "shotgun",  name: "Trench Shotgun",damage: 18, fireRate: 550, bulletSpeed: 700, spread: 0.35, bulletsPerShot: 6, cost: 800,  color: "#ff9b5a", magSize: 6,  reserveMax: 36,  reloadTime: 2.0 },
  rifle:    { id: "rifle",    name: "Marksman Rifle",damage: 70, fireRate: 480, bulletSpeed: 1000,spread: 0.02, bulletsPerShot: 1, cost: 1400, color: "#ff5a5a", magSize: 5,  reserveMax: 30,  reloadTime: 2.0 },
  plasma:   { id: "plasma",   name: "Toxin Blaster", damage: 40, fireRate: 180, bulletSpeed: 820, spread: 0.06, bulletsPerShot: 1, cost: 2500, color: "#8bff6a", magSize: 20, reserveMax: 80,  reloadTime: 1.8 },
};

const MAIN_QUEST: QuestStep[] = [
  { id: "m1", text: "Reach the Outpost Radio (NW)", type: "reach", location: { x: 300, y: 300 }, done: false },
  { id: "m2", text: "Purge the horde: kill 15 zombies", type: "kill", target: 15, progress: 0, done: false },
  { id: "m3", text: "Buy a new weapon at any station", type: "buy", done: false },
  { id: "m4", text: "Recover the Sector Key (SE ruin)", type: "reach", location: { x: 2050, y: 1500 }, done: false },
  { id: "m5", text: "Enter the Underworld Gate (center)", type: "reach", location: { x: WORLD_W / 2, y: WORLD_H / 2 }, done: false },
];

const SIDE_QUESTS: SideQuest[] = [
  {
    id: "sq_lights", title: "The RGB Sequence", accepted: true, done: false, reward: "MAX_RESOURCES",
    steps: [
      { id: "l1", text: "Shoot the Red Light", type: "shoot", color: "#ff0000", location: { x: 400, y: 400 }, done: false },
      { id: "l2", text: "Shoot the Green Light", type: "shoot", color: "#00ff00", location: { x: 2000, y: 400 }, done: false },
      { id: "l3", text: "Shoot the Blue Light", type: "shoot", color: "#0000ff", location: { x: 1200, y: 1400 }, done: false },
    ],
  },
  {
    id: "sq_supply", title: "Supply Run: Recover 4 Crates", accepted: true, done: false, reward: 300,
    steps: [
      { id: "c1", text: "Recover crate — NW ruins", type: "reach", location: { x: 300, y: 900 }, done: false },
      { id: "c2", text: "Recover crate — NE outpost", type: "reach", location: { x: 2100, y: 900 }, done: false },
      { id: "c3", text: "Recover crate — south depot", type: "reach", location: { x: 800, y: 1500 }, done: false },
      { id: "c4", text: "Recover crate — east alley", type: "reach", location: { x: 1700, y: 1500 }, done: false },
    ],
  },
];

// ---------- Helpers ----------
const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

// ---------- Component ----------
export default function DeadSectorGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [uiTick, setUiTick] = useState(0);
  const [screen, setScreen] = useState<"title" | "playing" | "dead" | "win">("title");
  const stateRef = useRef(createInitialState());

  const forceUi = useCallback(() => setUiTick((n) => n + 1), []);

  // Input
  useEffect(() => {
    
    const onDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === "e") tryInteract(stateRef.current, forceUi);
      if (e.key.toLowerCase() === "r") startReload(stateRef.current);
      if (e.key === "1") switchWeapon(stateRef.current, 0);
      if (e.key === "2") switchWeapon(stateRef.current, 1);
      if (e.key === "3") switchWeapon(stateRef.current, 2);
      if (e.key === "4") switchWeapon(stateRef.current, 3);
      if (e.key === "5") switchWeapon(stateRef.current, 4);
    };
    const onUp = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [forceUi]);

  // Mouse
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const onMove = (e: MouseEvent) => {
      const r = c.getBoundingClientRect();
      stateRef.current.mouse.x = (e.clientX - r.left) * (c.width / r.width);
      stateRef.current.mouse.y = (e.clientY - r.top) * (c.height / r.height);
    };
    const onDown = () => { stateRef.current.mouse.down = true; };
    const onUp = () => { stateRef.current.mouse.down = false; };
    c.addEventListener("mousemove", onMove);
    c.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    return () => {
      c.removeEventListener("mousemove", onMove);
      c.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (screen !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = performance.now();
    let uiCounter = 0;

    audio.resume().then(() => {
      if (stateRef.current.inArena) {
        audio.playMusic("boss");
      } else {
        audio.playMusic("main");
      }
    });

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const s = stateRef.current;
      update(s, dt);
      render(ctx, canvas, s);
      if (s.player.hp <= 0) { setScreen("dead"); return; }
      if (s.won) { setScreen("win"); return; }
      uiCounter++;
      if (uiCounter % 10 === 0) forceUi();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [screen, forceUi]);

  // Resize
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const resize = () => {
      c.width = c.clientWidth;
      c.height = c.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      if (screen !== "playing") {
        audio.stopMusic();
      }
    };
  }, [screen]);

  const s = stateRef.current;
  const activeSlot = s.player.inventory[s.player.weaponIndex];
  const activeWeapon = activeSlot.weapon;
  const isReloading = s.player.reloadingSlot === s.player.weaponIndex && s.time < s.player.reloadUntil;
  const reloadPct = isReloading ? 1 - Math.max(0, (s.player.reloadUntil - s.time) / activeWeapon.reloadTime) : 0;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      <canvas ref={canvasRef} className="block h-screen w-screen cursor-crosshair" />

      {screen === "title" && (
        <TitleScreen onStart={() => { stateRef.current = createInitialState(); setScreen("playing"); }} />
      )}
      {screen === "dead" && (
        <Overlay title="YOU DIED" subtitle={`The sector claims another. Time: ${formatTime(s.time)}`} action="Retry" onAction={() => { stateRef.current = createInitialState(); setScreen("playing"); }} />
      )}
      {screen === "win" && (
        <Overlay title="SECTOR CLEARED" subtitle={`The underworld falls silent. Clear time: ${formatTime(s.time)}`} action="Play Again" onAction={() => { stateRef.current = createInitialState(); setScreen("playing"); }} />
      )}

      {screen === "playing" && (
        <>
  {/* HUD */}
  <div className="pointer-events-none absolute inset-0 p-4 font-mono text-sm">
    <div className="flex items-start justify-between gap-4">
      {/* Left: Health / Weapon / Cash */}
      <div className="pointer-events-auto rounded-md border border-border bg-card/80 p-3 backdrop-blur">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">HP</span>
          <div className="h-3 w-40 overflow-hidden rounded-sm border border-border bg-background">
            <div className="h-full bg-accent transition-all" style={{ width: `${(s.player.hp / s.player.maxHp) * 100}%` }} />
          </div>
          <span className="text-xs">{Math.max(0, Math.ceil(s.player.hp))}/{s.player.maxHp}</span>
        </div>
        <div className="text-xs text-muted-foreground">CREDITS: <span className="text-hud">${s.player.cash}</span></div>
        <div className="mt-1 text-xs">
          <span className="text-muted-foreground">WEAPON:</span>{" "}
          <span style={{ color: activeWeapon.color }}>{activeWeapon.name}</span>
        </div>
        <div className="mt-1 text-xs">
          <span className="text-muted-foreground">AMMO:</span>{" "}
          {isReloading ? (
            <span className="text-accent">RELOADING</span>
          ) : (
            <span className="text-hud">{activeSlot.ammo}<span className="text-muted-foreground">/{activeWeapon.magSize}</span> <span className="text-muted-foreground">[{activeSlot.reserve}]</span></span>
          )}
          <span className="ml-2 text-[10px] text-muted-foreground">R to reload</span>
        </div>
        {isReloading && (
          <div className="mt-1 h-1 w-40 overflow-hidden rounded-sm bg-background">
            <div className="h-full bg-accent" style={{ width: `${reloadPct * 100}%` }} />
          </div>
        )}
        <div className="mt-1 flex gap-1">
          {s.player.inventory.map((slot, i) => (
            <span key={slot.weapon.id} className={`rounded-sm border px-1.5 py-0.5 text-[10px] ${i === s.player.weaponIndex ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
              {i + 1} {slot.weapon.name.split(" ")[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Center: Round Counter + Timer */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
        <div className="text-4xl font-bold text-accent tracking-tighter italic">ROUND {s.round}</div>
        <div className="text-xs text-muted-foreground">KILLS: {s.killedInRound}/{s.zombiesToKill}</div>
        <div className="mt-1 font-mono text-lg tabular-nums text-hud">{formatTime(s.time)}</div>
      </div>

      {/* Right: Quests */}
      <div className="pointer-events-auto max-w-sm rounded-md border border-border bg-card/80 p-3 backdrop-blur">
        <div className="mb-1 text-xs uppercase tracking-widest text-primary">Main Quest</div>
        <ul className="space-y-1 text-xs">
          {s.mainQuest.map((q) => (
            <li key={q.id} className={q.done ? "text-muted-foreground line-through" : "text-foreground"}>
              • {q.text}{q.type === "kill" ? ` (${q.progress}/${q.target})` : ""}
            </li>
          ))}
        </ul>
        {s.sideQuests.some(q => q.accepted && !q.done) && (
          <>
            <div className="mb-1 mt-2 text-xs uppercase tracking-widest text-toxic">Side Quests</div>
            <ul className="space-y-1 text-xs">
              {s.sideQuests.filter(q => q.accepted && !q.done).map(q => (
                <li key={q.id}>
                  • {q.title}: {q.steps[0].text}{q.steps[0].type === "kill" ? ` (${q.steps[0].progress}/${q.steps[0].target})` : ""}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>


            {/* Bottom center hint */}
            {s.interactHint && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-md border border-primary bg-card/90 px-4 py-2 text-sm text-primary shadow-lg">
                [E] {s.interactHint}
              </div>
            )}

            {/* Boss HP */}
            {s.inArena && s.boss && (
              <div className="absolute bottom-4 left-1/2 w-[520px] -translate-x-1/2">
                <div className="mb-1 text-center text-xs uppercase tracking-widest text-accent">
                  THE HARVESTER — Phase {s.boss.phase}/3
                </div>
                <div className="h-4 overflow-hidden rounded-sm border border-accent bg-background">
                  <div className="h-full bg-accent transition-all" style={{ width: `${(s.boss.hp / s.boss.maxHp) * 100}%` }} />
                </div>
              </div>
            )}

            {/* Toasts */}
            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1">
              {s.toasts.map((t, i) => (
                <div key={i} className="rounded-md border border-border bg-card/90 px-3 py-1 text-xs text-hud shadow">{t.msg}</div>
              ))}
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 left-4 text-[10px] text-muted-foreground">
              WASD move · Mouse aim/fire · E interact · 1-5 weapons
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------- UI ----------
function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur">
      <div className="max-w-lg text-center">
        <h1 className="text-6xl tracking-widest text-accent" style={{ fontFamily: "var(--font-display)" }}>DEAD SECTOR</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          A top-down zombie shooter. Complete the main quest, take side jobs, and enter the underworld arena to face The Harvester's three-phase assault.
        </p>
        <button
          onClick={onStart}
          className="mt-8 rounded-md border-2 border-primary bg-primary/10 px-8 py-3 text-lg tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          ENTER THE SECTOR
        </button>
        <div className="mt-6 text-[10px] text-muted-foreground">
          WASD move · Mouse aim &amp; fire · E interact · 1-5 switch weapons
        </div>
      </div>
    </div>
  );
}

function Overlay({ title, subtitle, action, onAction }: { title: string; subtitle: string; action: string; onAction: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/85 backdrop-blur">
      <div className="text-center">
        <h1 className="text-6xl tracking-widest text-accent" style={{ fontFamily: "var(--font-display)" }}>{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
        <button
          onClick={onAction}
          className="mt-6 rounded-md border-2 border-primary bg-primary/10 px-6 py-2 text-primary hover:bg-primary hover:text-primary-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {action}
        </button>
      </div>
    </div>
  );
}

// ---------- Game State ----------
type GameState = ReturnType<typeof createInitialState>;

function createInitialState() {
  const player = {
    pos: { x: WORLD_W / 2 - 300, y: WORLD_H / 2 } as Vec,
    hp: 100, maxHp: 100,
    cash: 150,
    inventory: [makeSlot(WEAPONS.pistol)] as WeaponSlot[],
    weaponIndex: 0,
    lastShot: 0,
    aim: 0,
    invuln: 0,
    reloadUntil: 0,
    reloadingSlot: -1,
  };
  const round = 1;
  const zombiesToKill = 10;
  const killedInRound = 0;
  const stations: Station[] = [
    { pos: { x: 500, y: 500 },   weapon: WEAPONS.smg,     label: "SMG" },
    { pos: { x: 1900, y: 500 },  weapon: WEAPONS.shotgun, label: "Shotgun" },
    { pos: { x: 500, y: 1400 },  weapon: WEAPONS.rifle,   label: "Rifle" },
    { pos: { x: 1900, y: 1400 }, weapon: WEAPONS.plasma,  label: "Plasma" },
  ];
  const npcs: NPC[] = [];
  const worldObjects: WorldObject[] = [
    { pos: { x: 400, y: 400 }, color: "#ff0000", radius: 15, questId: "sq_lights", stepId: "l1", active: true, locked: false },
    { pos: { x: 2000, y: 400 }, color: "#00ff00", radius: 15, questId: "sq_lights", stepId: "l2", active: true, locked: false },
    { pos: { x: 1200, y: 1400 }, color: "#0000ff", radius: 15, questId: "sq_lights", stepId: "l3", active: true, locked: false },
  ];
  const gate: Vec = { x: WORLD_W / 2, y: WORLD_H / 2 };
  return {
    keys: {} as Record<string, boolean>,
    mouse: { x: 0, y: 0, down: false },
    player,
    bullets: [] as Bullet[],
    zombies: [] as Zombie[],
    particles: [] as { pos: Vec; vel: Vec; life: number; color: string }[],
    stations,
    npcs,
    worldObjects,
    gate,
    mainQuest: MAIN_QUEST.map(q => ({ ...q })),
    sideQuests: SIDE_QUESTS.map(q => ({ ...q, steps: q.steps.map(s => ({ ...s })) })),
    mainIndex: 0,
    round: 1,
    zombiesToKill: 10,
    killedInRound: 0,
    spawnTimer: 0,
    toasts: [] as { msg: string; life: number }[],
    interactHint: "" as string,
    interactTarget: null as null | { kind: "station" | "npc" | "gate" | "worldobject"; ref: unknown },
    camera: { x: 0, y: 0 },
    inArena: false,
    boss: null as Boss | null,
    won: false,
    time: 0,
  };
}

// ---------- Update ----------
function update(s: GameState, dt: number) {
  s.time += dt;
  finishReloadIfDue(s);

  // Player movement
  const speed = PLAYER_SPEED;
  const mv: Vec = { x: 0, y: 0 };
  if (s.keys["w"] || s.keys["arrowup"]) mv.y -= 1;
  if (s.keys["s"] || s.keys["arrowdown"]) mv.y += 1;
  if (s.keys["a"] || s.keys["arrowleft"]) mv.x -= 1;
  if (s.keys["d"] || s.keys["arrowright"]) mv.x += 1;
  const len = Math.hypot(mv.x, mv.y) || 1;
  s.player.pos.x += (mv.x / len) * speed * dt;
  s.player.pos.y += (mv.y / len) * speed * dt;

  const bounds = s.inArena
    ? { minX: (WORLD_W - ARENA_W) / 2, minY: (WORLD_H - ARENA_H) / 2, maxX: (WORLD_W + ARENA_W) / 2, maxY: (WORLD_H + ARENA_H) / 2 }
    : { minX: 40, minY: 40, maxX: WORLD_W - 40, maxY: WORLD_H - 40 };
  s.player.pos.x = clamp(s.player.pos.x, bounds.minX + PLAYER_RADIUS, bounds.maxX - PLAYER_RADIUS);
  s.player.pos.y = clamp(s.player.pos.y, bounds.minY + PLAYER_RADIUS, bounds.maxY - PLAYER_RADIUS);

  // Camera
  const canvas = document.querySelector("canvas");
  const cw = canvas?.width ?? 1280;
  const ch = canvas?.height ?? 720;
  s.camera.x = clamp(s.player.pos.x - cw / 2, 0, WORLD_W - cw);
  s.camera.y = clamp(s.player.pos.y - ch / 2, 0, WORLD_H - ch);
  if (WORLD_W < cw) s.camera.x = (WORLD_W - cw) / 2;
  if (WORLD_H < ch) s.camera.y = (WORLD_H - ch) / 2;

  // Aim & shoot
  const worldMouse = { x: s.mouse.x + s.camera.x, y: s.mouse.y + s.camera.y };
  s.player.aim = Math.atan2(worldMouse.y - s.player.pos.y, worldMouse.x - s.player.pos.x);
  if (s.mouse.down) tryShoot(s);

  // Interaction hint
  s.interactHint = "";
  s.interactTarget = null;
  if (!s.inArena) {
    for (const st of s.stations) {
      if (dist(s.player.pos, st.pos) < 60) {
        const owned = s.player.inventory.some(slot => slot.weapon.id === st.weapon.id);
        s.interactHint = owned ? `${st.weapon.name} owned — refill ammo` : `Buy ${st.weapon.name} — $${st.weapon.cost}`;
        s.interactTarget = { kind: "station", ref: st };
        break;
      }
    }
    if (!s.interactTarget) for (const n of s.npcs) {
      if (dist(s.player.pos, n.pos) < 55) {
        s.interactHint = `${n.name}: "Greetings"`;
        s.interactTarget = { kind: "npc", ref: n };
        break;
      }
    }
    if (!s.interactTarget && dist(s.player.pos, s.gate) < 70) {
      const step = s.mainQuest[4];
      if (step && !step.done && s.mainQuest.slice(0, 4).every(q => q.done)) {
        s.interactHint = "Enter the Underworld Gate";
        s.interactTarget = { kind: "gate", ref: null };
      } else {
        s.interactHint = "Underworld Gate — sealed";
      }
    }
  }

  // Reach quest checks
  updateReachQuests(s);

  // Spawn zombies
  if (!s.inArena) {
    s.spawnTimer -= dt;
    const cap = Math.min(5 + s.round * 3, 8);
    const remainingToSpawn = s.zombiesToKill - s.killedInRound - s.zombies.length;
    if (s.spawnTimer <= 0 && s.zombies.length < cap && remainingToSpawn > 0) {
      s.spawnTimer = rand(0.6, 1.4);
      spawnZombie(s);
    }
    if (s.killedInRound >= s.zombiesToKill && s.zombies.length === 0) {
      s.round++;
      s.killedInRound = 0;
      s.zombiesToKill += 5;
      s.spawnTimer = 2;
      s.worldObjects.forEach(obj => obj.locked = false);
      pushToast(s, `ROUND ${s.round} BEGINS`);
    }
  }

  // Zombies AI
  for (const z of s.zombies) {
    const dx = s.player.pos.x - z.pos.x;
    const dy = s.player.pos.y - z.pos.y;
    const d = Math.hypot(dx, dy) || 1;
    z.pos.x += (dx / d) * z.speed * dt;
    z.pos.y += (dy / d) * z.speed * dt;
  if (d < z.radius + PLAYER_RADIUS) {
    if (s.player.invuln <= 0) {
      s.player.hp -= z.damage;
      s.player.invuln = 0.5;
      pushToast(s, "-" + z.damage + " HP");
      audio.playHurt();
    }
  }

  }
  s.player.invuln = Math.max(0, s.player.invuln - dt);

  // Zombie-zombie spacing (soft)
  for (let i = 0; i < s.zombies.length; i++) {
    for (let j = i + 1; j < s.zombies.length; j++) {
      const a = s.zombies[i], b = s.zombies[j];
      const dx = b.pos.x - a.pos.x, dy = b.pos.y - a.pos.y;
      const d = Math.hypot(dx, dy) || 1;
      const min = a.radius + b.radius;
      if (d < min) {
        const push = (min - d) / 2;
        a.pos.x -= (dx / d) * push; a.pos.y -= (dy / d) * push;
        b.pos.x += (dx / d) * push; b.pos.y += (dy / d) * push;
      }
    }
  }

  // Bullets
  for (const b of s.bullets) {
    b.pos.x += b.vel.x * dt;
    b.pos.y += b.vel.y * dt;
    b.life -= dt;
  }
  // Bullet vs targets
  for (const b of s.bullets) {
    if (b.life <= 0) continue;
    if (b.friendly) {
      for (const z of s.zombies) {
        if (z.hp <= 0) continue;
        if (dist(b.pos, z.pos) < z.radius + b.radius) {
          z.hp -= b.damage;
          b.life = 0;
          spark(s, b.pos, "#ff6a6a");
          audio.playHit();
          break;
        }
      }
      if (b.life > 0 && s.boss && s.inArena) {
        if (dist(b.pos, s.boss.pos) < s.boss.radius + b.radius) {
          if (s.boss.invulnTimer <= 0) {
            s.boss.hp -= b.damage;
            spark(s, b.pos, "#ff3a3a");
            audio.playHit();
          }
          b.life = 0;
        }
      }
    } else {
  if (dist(b.pos, s.player.pos) < PLAYER_RADIUS + b.radius) {
    if (s.player.invuln <= 0) {
      s.player.hp -= b.damage;
      s.player.invuln = 0.3;
      pushToast(s, "-" + b.damage + " HP");
      audio.playHurt();
    }
    b.life = 0;
  }

    }
  }
  // Cull
  s.bullets = s.bullets.filter(b => b.life > 0 &&
    b.pos.x > -50 && b.pos.x < WORLD_W + 50 && b.pos.y > -50 && b.pos.y < WORLD_H + 50);

  // Dead zombies
  const remaining: Zombie[] = [];
  for (const z of s.zombies) {
    if (z.hp <= 0) {
      s.player.cash += z.kind === "brute" ? 60 : z.kind === "runner" ? 25 : 15;
      spark(s, z.pos, "#7a1a1a", 12);
      s.killedInRound++;
      // main kill quest
      const killStep = s.mainQuest.find(q => q.type === "kill" && !q.done);
      if (killStep) { killStep.progress = (killStep.progress ?? 0) + 1; if (killStep.progress >= (killStep.target ?? 0)) { killStep.done = true; pushToast(s, "Main step complete"); } }
      // side quests
      for (const sq of s.sideQuests) {
        if (!sq.accepted || sq.done) continue;
        for (const st of sq.steps) {
          if (st.done || st.type !== "kill") continue;
          if (sq.id === "sq1" && z.kind !== "runner") continue;
          if (sq.id === "sq3" && z.kind !== "brute") continue;
          st.progress = (st.progress ?? 0) + 1;
          if (st.progress >= (st.target ?? 0)) { st.done = true; pushToast(s, `${sq.title}: objective complete`); }
        }
      }
    } else remaining.push(z);
  }
  s.zombies = remaining;
  
   // RGB Light Quest Logic
   for (const b of s.bullets) {
     if (!b.friendly) continue;
     for (const obj of s.worldObjects) {
       if (!obj.active || obj.locked) continue;
       if (dist(b.pos, obj.pos) < obj.radius + b.radius) {
         b.life = 0;
         spark(s, b.pos, obj.color);
         const sq = s.sideQuests.find(q => q.id === obj.questId);
         if (sq) {
           const currentStepIdx = sq.steps.findIndex(step => !step.done);
           const targetStep = sq.steps[currentStepIdx];
           if (targetStep && targetStep.id === obj.stepId) {
             targetStep.done = true;
             pushToast(s, "Light activated!");
             if (sq.steps.every(st => st.done)) {
               sq.done = true;
               s.player.hp = s.player.maxHp;
               pushToast(s, "RGB Sequence complete: MAX HEALTH & AMMO!");
             }
           } else {
             pushToast(s, "Wrong order! Sequence locked until next round.");
             sq.steps.forEach(st => st.done = false);
             s.worldObjects.forEach(o => o.locked = true);
           }
         }
         break;
       }
     }
   }

  
  // Particles
  for (const p of s.particles) {
    p.pos.x += p.vel.x * dt; p.pos.y += p.vel.y * dt;
    p.vel.x *= 0.9; p.vel.y *= 0.9;
    p.life -= dt;
  }
  s.particles = s.particles.filter(p => p.life > 0);

  // Toasts
  for (const t of s.toasts) t.life -= dt;
  s.toasts = s.toasts.filter(t => t.life > 0).slice(-4);

  // Boss
  if (s.inArena && s.boss) updateBoss(s, dt);
}

function tryShoot(s: GameState) {
  const slot = s.player.inventory[s.player.weaponIndex];
  const w = slot.weapon;
  const now = performance.now();
  // Can't fire while reloading
  if (s.player.reloadingSlot === s.player.weaponIndex && s.time < s.player.reloadUntil) return;
  if (now - s.player.lastShot < w.fireRate) return;
  if (slot.ammo <= 0) {
    // Auto-reload attempt
    if (slot.reserve > 0) startReload(s);
    return;
  }
  s.player.lastShot = now;
  slot.ammo -= 1;
  audio.playShoot(w.id);
  for (let i = 0; i < w.bulletsPerShot; i++) {
    const a = s.player.aim + (Math.random() - 0.5) * w.spread * 2;
    s.bullets.push({
      pos: { x: s.player.pos.x + Math.cos(s.player.aim) * 18, y: s.player.pos.y + Math.sin(s.player.aim) * 18 },
      vel: { x: Math.cos(a) * w.bulletSpeed, y: Math.sin(a) * w.bulletSpeed },
      damage: w.damage, life: 1.2, friendly: true, color: w.color, radius: 3,
    });
  }
  if (slot.ammo === 0 && slot.reserve > 0) startReload(s);
}

function startReload(s: GameState) {
  const idx = s.player.weaponIndex;
  const slot = s.player.inventory[idx];
  if (slot.ammo >= slot.weapon.magSize || slot.reserve <= 0) return;
  if (s.player.reloadingSlot === idx && s.time < s.player.reloadUntil) return;
  s.player.reloadingSlot = idx;
  s.player.reloadUntil = s.time + slot.weapon.reloadTime;
}

function finishReloadIfDue(s: GameState) {
  if (s.player.reloadingSlot < 0) return;
  if (s.time < s.player.reloadUntil) return;
  const slot = s.player.inventory[s.player.reloadingSlot];
  if (!slot) { s.player.reloadingSlot = -1; return; }
  const need = slot.weapon.magSize - slot.ammo;
  const take = Math.min(need, slot.reserve);
  slot.ammo += take;
  slot.reserve -= take;
  s.player.reloadingSlot = -1;
}

function makeSlot(w: Weapon): WeaponSlot {
  return { weapon: w, ammo: w.magSize, reserve: w.reserveMax };
}

function refillAmmo(s: GameState, fraction = 1) {
  for (const slot of s.player.inventory) {
    slot.reserve = Math.min(slot.weapon.reserveMax, slot.reserve + Math.ceil(slot.weapon.reserveMax * fraction));
  }
}

function formatTime(t: number) {
  const total = Math.max(0, t);
  const m = Math.floor(total / 60);
  const sec = Math.floor(total % 60);
  const cs = Math.floor((total * 100) % 100);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

function spawnZombie(s: GameState) {
  // spawn off-screen
  const cam = s.camera;
  const cw = document.querySelector("canvas")?.width ?? 1280;
  const ch = document.querySelector("canvas")?.height ?? 720;
  let pos: Vec = { x: 0, y: 0 };
  for (let tries = 0; tries < 20; tries++) {
    pos = { x: rand(60, WORLD_W - 60), y: rand(60, WORLD_H - 60) };
    const sx = pos.x - cam.x, sy = pos.y - cam.y;
    if (sx < -50 || sx > cw + 50 || sy < -50 || sy > ch + 50) break;
  }
  const r = Math.random();
  let z: Zombie;
  if (r < 0.55) z = { pos, hp: 40, maxHp: 40, speed: 55, damage: 8, radius: 14, kind: "walker" };
  else if (r < 0.9) z = { pos, hp: 25, maxHp: 25, speed: 110, damage: 6, radius: 12, kind: "runner" };
  else z = { pos, hp: 140, maxHp: 140, speed: 45, damage: 20, radius: 20, kind: "brute" };
  s.zombies.push(z);
}

function updateReachQuests(s: GameState) {
  for (const q of s.mainQuest) {
    if (q.done || q.type !== "reach" || !q.location) continue;
    // main quest is ordered
    const idx = s.mainQuest.indexOf(q);
    if (idx > 0 && !s.mainQuest[idx - 1].done) continue;
    if (idx === 4) continue; // gate handled via interact
    if (dist(s.player.pos, q.location) < 55) { q.done = true; pushToast(s, "Main step complete"); }
  }
  for (const sq of s.sideQuests) {
    if (!sq.accepted || sq.done) continue;
    for (const st of sq.steps) {
      if (!st.done && st.type === "reach" && st.location && dist(s.player.pos, st.location) < 55) {
        st.done = true; pushToast(s, `${sq.title}: objective complete`);
      }
    }
    // Auto-complete side quests that have no NPC turn-in
    if (sq.id === "sq_supply" && !sq.done && sq.steps.every(x => x.done)) {
      sq.done = true;
      const amount = typeof sq.reward === "number" ? sq.reward : 0;
      s.player.cash += amount;
      pushToast(s, `+$${amount} — ${sq.title} complete`);
      audio.playInteract();
    }
  }
}

function tryInteract(s: GameState, forceUi: () => void) {
  if (!s.interactTarget) return;
  const t = s.interactTarget;
  if (t.kind === "station") {
    const st = t.ref as Station;
    const owned = s.player.inventory.some(slot => slot.weapon.id === st.weapon.id);
    if (owned) {
      const cost = Math.max(20, Math.floor(st.weapon.cost * 0.15));
      if (s.player.cash >= cost) {
        s.player.cash -= cost;
        const slot = s.player.inventory.find(x => x.weapon.id === st.weapon.id)!;
        slot.reserve = st.weapon.reserveMax;
        slot.ammo = st.weapon.magSize;
        pushToast(s, `Ammo refilled — $${cost}`);
      } else {
        pushToast(s, `Refill costs $${cost}`);
      }
      audio.playInteract();
    }
    else if (s.player.cash >= st.weapon.cost) {
      s.player.cash -= st.weapon.cost;
      s.player.inventory.push(makeSlot(st.weapon));
      s.player.weaponIndex = s.player.inventory.length - 1;
      pushToast(s, `Bought ${st.weapon.name}`);
      const buyStep = s.mainQuest.find(q => q.type === "buy" && !q.done);
      if (buyStep) { buyStep.done = true; pushToast(s, "Main step complete"); }
      audio.playInteract();
    } else {
      pushToast(s, "Not enough credits");
      audio.playInteract();
    }
  } else if (t.kind === "npc") {
    const n = t.ref as NPC;
    const sq = s.sideQuests.find(q => q.id === n.sideQuestId)!;
    if (!sq.accepted) { 
      sq.accepted = true; 
      pushToast(s, `Accepted: ${sq.title}`); 
      audio.playInteract();
    }
    else if (sq.steps.every(x => x.done) && !sq.done) {
      sq.done = true; 
      if (sq.reward === "MAX_RESOURCES") {
        s.player.hp = s.player.maxHp;
        pushToast(s, `Reward: Max Health & Ammo!`);
      } else {
        const amount = typeof sq.reward === "number" ? sq.reward : 0;
        s.player.cash += amount;
        pushToast(s, `+$${amount} — ${sq.title} complete`);
      }
      audio.playInteract();
    }
  } else if (t.kind === "gate") {
    const step = s.mainQuest[4];
    if (step && !step.done && s.mainQuest.slice(0, 4).every(q => q.done)) {
      step.done = true;
      enterArena(s);
    }
  }
  forceUi();
}

function switchWeapon(s: GameState, i: number) {
  if (i < s.player.inventory.length) {
    // Cancel in-progress reload when switching
    if (s.player.reloadingSlot !== i) s.player.reloadingSlot = -1;
    s.player.weaponIndex = i;
  }
}

function pushToast(s: GameState, msg: string) {
  s.toasts.push({ msg, life: 2.2 });
}

function spark(s: GameState, pos: Vec, color: string, n = 6) {
  for (let i = 0; i < n; i++) {
    s.particles.push({
      pos: { ...pos },
      vel: { x: rand(-140, 140), y: rand(-140, 140) },
      life: rand(0.2, 0.5),
      color,
    });
  }
}

// ---------- Boss ----------
function enterArena(s: GameState) {
  s.inArena = true;
  s.zombies = [];
  s.bullets = [];
  s.player.pos = { x: WORLD_W / 2, y: WORLD_H / 2 + 300 };
  s.player.hp = Math.max(s.player.hp, 80);
  s.boss = {
    pos: { x: WORLD_W / 2, y: WORLD_H / 2 - 250 },
    hp: 1500, maxHp: 1500,
    phase: 1,
    attackTimer: 1.5,
    moveTimer: 0,
    target: { x: WORLD_W / 2, y: WORLD_H / 2 - 200 },
    radius: 46,
    invulnTimer: 0.6,
  };
  pushToast(s, "THE HARVESTER awakens");
  audio.playMusic("boss");
}

function updateBoss(s: GameState, dt: number) {
  const b = s.boss!;
  b.invulnTimer = Math.max(0, b.invulnTimer - dt);
  // Phase transitions
  const p = b.hp / b.maxHp;
  const targetPhase: Phase = p > 0.66 ? 1 : p > 0.33 ? 2 : 3;
  if (targetPhase > b.phase) {
    b.phase = targetPhase;
    b.invulnTimer = 1.2;
    pushToast(s, `Phase ${b.phase}!`);
    // heal player a bit between phases
    s.player.hp = Math.min(s.player.maxHp, s.player.hp + 25);
    // clear minions on phase change
    s.zombies = [];
  }
  if (b.hp <= 0) {
    s.won = true;
    return;
  }

  // Movement
  b.moveTimer -= dt;
  if (b.moveTimer <= 0) {
    b.moveTimer = rand(1.5, 3);
    b.target = {
      x: (WORLD_W - ARENA_W) / 2 + rand(150, ARENA_W - 150),
      y: (WORLD_H - ARENA_H) / 2 + rand(120, ARENA_H / 2),
    };
  }
  const dx = b.target.x - b.pos.x, dy = b.target.y - b.pos.y;
  const d = Math.hypot(dx, dy) || 1;
  const spd = b.phase === 1 ? 60 : b.phase === 2 ? 95 : 130;
  b.pos.x += (dx / d) * spd * dt;
  b.pos.y += (dy / d) * spd * dt;

  // Attacks
  b.attackTimer -= dt;
  if (b.attackTimer <= 0) {
    if (b.phase === 1) {
      // spread shot
      const base = Math.atan2(s.player.pos.y - b.pos.y, s.player.pos.x - b.pos.x);
      for (let i = -2; i <= 2; i++) {
        const a = base + i * 0.14;
        s.bullets.push({ pos: { ...b.pos }, vel: { x: Math.cos(a) * 320, y: Math.sin(a) * 320 }, damage: 10, life: 3, friendly: false, color: "#ff5a5a", radius: 6 });
      }
      b.attackTimer = 1.6;
    } else if (b.phase === 2) {
      // ring + summon runners
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + s.time;
        s.bullets.push({ pos: { ...b.pos }, vel: { x: Math.cos(a) * 260, y: Math.sin(a) * 260 }, damage: 12, life: 2.5, friendly: false, color: "#ffa04a", radius: 6 });
      }
      if (s.zombies.length < 6) {
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2;
          s.zombies.push({ pos: { x: b.pos.x + Math.cos(a) * 90, y: b.pos.y + Math.sin(a) * 90 }, hp: 25, maxHp: 25, speed: 130, damage: 8, radius: 12, kind: "runner" });
        }
      }
      b.attackTimer = 2.2;
    } else {
      // aimed burst + spiral
      const base = Math.atan2(s.player.pos.y - b.pos.y, s.player.pos.x - b.pos.x);
      for (let i = 0; i < 3; i++) {
        const a = base + (Math.random() - 0.5) * 0.15;
        s.bullets.push({ pos: { ...b.pos }, vel: { x: Math.cos(a) * 460, y: Math.sin(a) * 460 }, damage: 14, life: 2.5, friendly: false, color: "#ff2a2a", radius: 7 });
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + s.time * 3;
        s.bullets.push({ pos: { ...b.pos }, vel: { x: Math.cos(a) * 220, y: Math.sin(a) * 220 }, damage: 10, life: 3, friendly: false, color: "#c86aff", radius: 6 });
      }
      b.attackTimer = 1.1;
    }
  }
}

// ---------- Render ----------
function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, s: GameState) {
  const cam = s.camera;
  ctx.fillStyle = s.inArena ? "#120608" : "#1a1310";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // Grid ground
  drawGround(ctx, s);

  if (s.inArena) drawArena(ctx, s);
  else drawWorldMarkers(ctx, s);

  if (!s.inArena) {
    for (const st of s.stations) drawStation(ctx, st, s);
    for (const obj of s.worldObjects) {
      const sq = s.sideQuests.find(q => q.id === obj.questId);
      const step = sq ? sq.steps.find(st => st.id === obj.stepId) : null;
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
          ctx.beginPath(); ctx.arc(obj.pos.x, obj.pos.y, obj.radius, 0, Math.PI * 2); ctx.stroke();
        }
      }
      ctx.beginPath(); ctx.arc(obj.pos.x, obj.pos.y, obj.radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "white"; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
  }


  // Gate
  if (!s.inArena) drawGate(ctx, s);

  // Zombies
  for (const z of s.zombies) drawZombie(ctx, z);

  // Boss
  if (s.boss && s.inArena) drawBoss(ctx, s.boss);

  // Bullets
  for (const b of s.bullets) {
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(b.pos.x, b.pos.y); ctx.lineTo(b.pos.x - b.vel.x * 0.02, b.pos.y - b.vel.y * 0.02); ctx.stroke();
  }

  // Particles
  for (const p of s.particles) {
    ctx.globalAlpha = clamp(p.life * 2, 0, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.pos.x, p.pos.y, 3, 3);
  }
  ctx.globalAlpha = 1;

  // Player
  drawPlayer(ctx, s);

  ctx.restore();

  // Vignette
  const g = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.4, canvas.width / 2, canvas.height / 2, canvas.height * 0.9);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGround(ctx: CanvasRenderingContext2D, s: GameState) {
  const step = 60;
  ctx.strokeStyle = s.inArena ? "rgba(140,40,40,0.15)" : "rgba(120,90,60,0.15)";
  ctx.lineWidth = 1;
  const startX = Math.floor(s.camera.x / step) * step;
  const startY = Math.floor(s.camera.y / step) * step;
  for (let x = startX; x < s.camera.x + 2000; x += step) {
    ctx.beginPath(); ctx.moveTo(x, s.camera.y - 100); ctx.lineTo(x, s.camera.y + 1400); ctx.stroke();
  }
  for (let y = startY; y < s.camera.y + 1500; y += step) {
    ctx.beginPath(); ctx.moveTo(s.camera.x - 100, y); ctx.lineTo(s.camera.x + 2400, y); ctx.stroke();
  }
}

function drawWorldMarkers(ctx: CanvasRenderingContext2D, s: GameState) {
  // outer border
  ctx.strokeStyle = "rgba(180,110,60,0.4)";
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, WORLD_W - 80, WORLD_H - 80);

  // Quest markers (only current uncompleted reach steps)
  for (let i = 0; i < s.mainQuest.length; i++) {
    const q = s.mainQuest[i];
    if (q.done || q.type !== "reach" || !q.location) continue;
    if (i > 0 && !s.mainQuest[i - 1].done) continue;
    drawMarker(ctx, q.location, "#e8c56a", "!");
  }
  for (const sq of s.sideQuests) {
    if (!sq.accepted || sq.done) continue;
    for (const st of sq.steps) {
      if (st.done || st.type !== "reach" || !st.location) continue;
      if (sq.id === "sq_supply") drawCrate(ctx, st.location);
      else drawMarker(ctx, st.location, "#8bff6a", "?");
    }
  }
}

function drawCrate(ctx: CanvasRenderingContext2D, p: Vec) {
  ctx.save();
  ctx.translate(p.x, p.y);
  // pulsing glow
  const t = performance.now() / 400;
  const glow = 0.4 + 0.3 * Math.sin(t);
  ctx.shadowColor = "#e8a04a";
  ctx.shadowBlur = 20 * glow;
  // crate body
  ctx.fillStyle = "#8a5a2b";
  ctx.fillRect(-18, -18, 36, 36);
  ctx.strokeStyle = "#e8a04a";
  ctx.lineWidth = 2;
  ctx.strokeRect(-18, -18, 36, 36);
  // metal bands
  ctx.beginPath();
  ctx.moveTo(-18, 0); ctx.lineTo(18, 0);
  ctx.moveTo(0, -18); ctx.lineTo(0, 18);
  ctx.stroke();
  ctx.restore();
  // pickup ring
  ctx.strokeStyle = "rgba(232,160,74,0.35)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 6]);
  ctx.beginPath(); ctx.arc(p.x, p.y, 55, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
}

function drawMarker(ctx: CanvasRenderingContext2D, p: Vec, color: string, label: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.arc(p.x, p.y, 40, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.font = "bold 22px 'JetBrains Mono', monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(label, p.x, p.y);
}

function drawArena(ctx: CanvasRenderingContext2D, _s: GameState) {
  const x = (WORLD_W - ARENA_W) / 2, y = (WORLD_H - ARENA_H) / 2;
  // arena floor
  ctx.fillStyle = "#1a0a0c";
  ctx.fillRect(x, y, ARENA_W, ARENA_H);
  // runes
  ctx.strokeStyle = "rgba(255,80,80,0.4)";
  ctx.lineWidth = 6;
  ctx.strokeRect(x + 20, y + 20, ARENA_W - 40, ARENA_H - 40);
  ctx.strokeStyle = "rgba(255,80,80,0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x + ARENA_W / 2, y + ARENA_H / 2, 200, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + ARENA_W / 2, y + ARENA_H / 2, 320, 0, Math.PI * 2); ctx.stroke();
}

function drawStation(ctx: CanvasRenderingContext2D, st: Station, s: GameState) {
  ctx.save();
  ctx.translate(st.pos.x, st.pos.y);
  ctx.fillStyle = "#2a1f18";
  ctx.strokeStyle = st.weapon.color;
  ctx.lineWidth = 3;
  ctx.fillRect(-28, -28, 56, 56);
  ctx.strokeRect(-28, -28, 56, 56);
  ctx.fillStyle = st.weapon.color;
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(st.label.toUpperCase(), 0, -2);
  ctx.fillStyle = "#e8c56a";
  ctx.font = "10px 'JetBrains Mono', monospace";
  const owned = s.player.inventory.some(slot => slot.weapon.id === st.weapon.id);
  ctx.fillText(owned ? "OWNED" : `$${st.weapon.cost}`, 0, 12);
  ctx.restore();
}

function drawNpc(ctx: CanvasRenderingContext2D, n: NPC, s: GameState) {
  ctx.fillStyle = n.color;
  ctx.beginPath(); ctx.arc(n.pos.x, n.pos.y, n.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#ccc";
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillText(n.name, n.pos.x, n.pos.y + 30);
}

function drawGate(ctx: CanvasRenderingContext2D, s: GameState) {
  const p = s.gate;
  const ready = s.mainQuest.slice(0, 4).every(q => q.done);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(s.time * 0.4);
  ctx.strokeStyle = ready ? "#ff3a3a" : "rgba(120,120,120,0.5)";
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.stroke();
  ctx.rotate(-s.time * 0.8);
  ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI * 1.4); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = ready ? "#ff8080" : "#888";
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("UNDERWORLD GATE", p.x, p.y + 74);
}

function drawZombie(ctx: CanvasRenderingContext2D, z: Zombie) {
  const color = z.kind === "brute" ? "#5a2a5a" : z.kind === "runner" ? "#3a6a3a" : "#4a5a3a";
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(z.pos.x, z.pos.y, z.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.stroke();
  // eyes
  ctx.fillStyle = "#ff3a3a";
  ctx.fillRect(z.pos.x - 5, z.pos.y - 3, 3, 3);
  ctx.fillRect(z.pos.x + 2, z.pos.y - 3, 3, 3);
  // hp bar
  if (z.hp < z.maxHp) {
    ctx.fillStyle = "#000"; ctx.fillRect(z.pos.x - z.radius, z.pos.y - z.radius - 8, z.radius * 2, 4);
    ctx.fillStyle = "#c33"; ctx.fillRect(z.pos.x - z.radius, z.pos.y - z.radius - 8, z.radius * 2 * (z.hp / z.maxHp), 4);
  }
}

function drawBoss(ctx: CanvasRenderingContext2D, b: Boss) {
  ctx.save();
  ctx.translate(b.pos.x, b.pos.y);
  const pulse = 1 + Math.sin(performance.now() / 200) * 0.05;
  ctx.rotate(performance.now() / 800);
  ctx.fillStyle = b.invulnTimer > 0 ? "#eee" : b.phase === 3 ? "#3a0a3a" : b.phase === 2 ? "#3a1a1a" : "#2a1010";
  ctx.strokeStyle = "#ff2a2a";
  ctx.lineWidth = 4;
  // spiky body
  ctx.beginPath();
  const spikes = 10;
  for (let i = 0; i < spikes * 2; i++) {
    const r = (i % 2 === 0 ? b.radius * 1.3 : b.radius * 0.85) * pulse;
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
  // eye
  ctx.fillStyle = "#ffcc33";
  ctx.beginPath(); ctx.arc(b.pos.x, b.pos.y, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.arc(b.pos.x, b.pos.y, 4, 0, Math.PI * 2); ctx.fill();
}

function drawPlayer(ctx: CanvasRenderingContext2D, s: GameState) {
  const p = s.player.pos;
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 8, PLAYER_RADIUS, 5, 0, 0, Math.PI * 2); ctx.fill();
  // body
  ctx.fillStyle = s.player.invuln > 0 ? "#ffffff" : "#d8a24a";
  ctx.beginPath(); ctx.arc(p.x, p.y, PLAYER_RADIUS, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.stroke();
  // gun
  const w = s.player.inventory[s.player.weaponIndex].weapon;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(s.player.aim);
  ctx.fillStyle = w.color;
  ctx.fillRect(6, -3, 22, 6);
  ctx.restore();
}
