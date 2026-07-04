import type { GameState, HiveMindBoss, Phase } from "../types";
import { pushToast, rand } from "../utils";
import { audio } from "../AudioEngine";

export function enterHospitalArena(s: GameState) {
  const map = s.selectedMap;
  const arenaW = map === "hospital" ? 800 : 1200;
  const arenaH = map === "hospital" ? 600 : 900;
  const worldW = map === "hospital" ? 2000 : 2400;
  const worldH = map === "hospital" ? 1600 : 1800;
  
  s.inArena = true;
  s.zombies = [];
  s.bullets = [];
  s.player.pos = { x: worldW / 2, y: worldH / 2 + arenaH / 2 - 100 };
  s.player.hp = Math.max(s.player.hp, 80);
  
  s.boss = {
    pos: { x: worldW / 2, y: worldH / 2 - arenaH / 4 },
    hp: 1800,
    maxHp: 1800,
    phase: 1,
    attackTimer: 2.0,
    moveTimer: 0,
    target: { x: worldW / 2, y: worldH / 2 - arenaH / 4 },
    radius: 50,
    invulnTimer: 1.0,
    type: "hivemind",
    spawnTimer: 0,
    spawnCooldown: 3.0,
    maxMinions: 6,
    exposed: false,
    exposeTimer: 0,
    exposeCooldown: 5.0,
  } as HiveMindBoss;
  
  pushToast(s, "THE HIVE MIND awakens");
  audio.playMusic("boss");
}

export function updateHiveMind(s: GameState, dt: number) {
  const b = s.boss as HiveMindBoss;
  if (!b || b.type !== "hivemind") return;
  
  b.invulnTimer = Math.max(0, b.invulnTimer - dt);
  const p = b.hp / b.maxHp;
  
  // Phase transitions
  const targetPhase: Phase = p > 0.66 ? 1 : p > 0.33 ? 2 : 3;
  if (targetPhase > b.phase) {
    b.phase = targetPhase;
    b.invulnTimer = 1.5;
    pushToast(s, `Phase ${b.phase}!`);
    s.player.hp = Math.min(s.player.maxHp, s.player.hp + 30);
    s.zombies = [];
    
    // Update max minions and cooldowns based on phase
    if (b.phase === 2) {
      b.maxMinions = 8;
      b.spawnCooldown = 2.5;
      b.exposeCooldown = 4.0;
    } else if (b.phase === 3) {
      b.maxMinions = 4; // Fewer but brutes
      b.spawnCooldown = 4.0;
      b.exposeCooldown = 3.0;
    }
  }
  
  if (b.hp <= 0) {
    s.won = true;
    return;
  }
  
  // Expose mechanic - boss becomes vulnerable periodically
  b.exposeTimer += dt;
  if (b.exposeTimer >= b.exposeCooldown) {
    b.exposed = true;
    b.exposeTimer = 0;
    pushToast(s, "Weak point exposed!");
  }
  
  if (b.exposed) {
    b.exposeTimer += dt;
    const exposeDuration = b.phase === 1 ? 2.0 : b.phase === 2 ? 1.5 : 1.0;
    if (b.exposeTimer >= exposeDuration) {
      b.exposed = false;
      b.exposeTimer = 0;
    }
  }
  
  // Spawn minions
  b.spawnTimer += dt;
  if (b.spawnTimer >= b.spawnCooldown && s.zombies.length < b.maxMinions) {
    b.spawnTimer = 0;
    spawnMinions(s, b);
  }
  
  // Attacks (tentacles and projectiles)
  b.attackTimer -= dt;
  if (b.attackTimer <= 0) {
    performHiveMindAttack(s, b);
  }
}

function spawnMinions(s: GameState, b: HiveMindBoss) {
  const worldW = s.selectedMap === "hospital" ? 2000 : 2400;
  const worldH = s.selectedMap === "hospital" ? 1600 : 1800;
  const arenaW = s.selectedMap === "hospital" ? 800 : 1200;
  const arenaH = s.selectedMap === "hospital" ? 600 : 900;
  
  const spawnCount = b.phase === 3 ? 2 : 3;
  
  for (let i = 0; i < spawnCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 40;
    const spawnPos = {
      x: b.pos.x + Math.cos(angle) * dist,
      y: b.pos.y + Math.sin(angle) * dist,
    };
    
    // Constrain to arena
    const arenaLeft = (worldW - arenaW) / 2;
    const arenaTop = (worldH - arenaH) / 2;
    spawnPos.x = Math.max(arenaLeft + 50, Math.min(arenaLeft + arenaW - 50, spawnPos.x));
    spawnPos.y = Math.max(arenaTop + 50, Math.min(arenaTop + arenaH - 50, spawnPos.y));
    
    let minion;
    if (b.phase === 3) {
      // Brutes in phase 3
      minion = {
        pos: spawnPos,
        hp: 140,
        maxHp: 140,
        speed: 45,
        damage: 20,
        radius: 20,
        kind: "brute" as const,
      };
    } else if (b.phase === 2) {
      // Runners in phase 2
      minion = {
        pos: spawnPos,
        hp: 25,
        maxHp: 25,
        speed: 110,
        damage: 6,
        radius: 12,
        kind: "runner" as const,
      };
    } else {
      // Walkers in phase 1
      minion = {
        pos: spawnPos,
        hp: 40,
        maxHp: 40,
        speed: 55,
        damage: 8,
        radius: 14,
        kind: "walker" as const,
      };
    }
    
    s.zombies.push(minion);
  }
}

function performHiveMindAttack(s: GameState, b: HiveMindBoss) {
  const worldW = s.selectedMap === "hospital" ? 2000 : 2400;
  const worldH = s.selectedMap === "hospital" ? 1600 : 1800;
  
  if (b.phase === 1) {
    // Phase 1: Simple projectile spread
    const base = Math.atan2(s.player.pos.y - b.pos.y, s.player.pos.x - b.pos.x);
    for (let i = -2; i <= 2; i++) {
      const a = base + i * 0.12;
      s.bullets.push({
        pos: { ...b.pos },
        vel: { x: Math.cos(a) * 280, y: Math.sin(a) * 280 },
        damage: 10,
        life: 3,
        friendly: false,
        color: "#ff8888",
        radius: 6,
      });
    }
    b.attackTimer = 1.8;
  } else if (b.phase === 2) {
    // Phase 2: Radial burst + aimed shots
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + s.time;
      s.bullets.push({
        pos: { ...b.pos },
        vel: { x: Math.cos(a) * 240, y: Math.sin(a) * 240 },
        damage: 12,
        life: 2.5,
        friendly: false,
        color: "#ffaa44",
        radius: 6,
      });
    }
    
    // Aimed shots
    const base = Math.atan2(s.player.pos.y - b.pos.y, s.player.pos.x - b.pos.x);
    for (let i = 0; i < 3; i++) {
      const a = base + (Math.random() - 0.5) * 0.2;
      s.bullets.push({
        pos: { ...b.pos },
        vel: { x: Math.cos(a) * 380, y: Math.sin(a) * 380 },
        damage: 14,
        life: 2.5,
        friendly: false,
        color: "#ff6644",
        radius: 7,
      });
    }
    b.attackTimer = 2.2;
  } else {
    // Phase 3: Spore clouds + spiral + aimed
    // Spiral pattern
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + s.time * 2;
      s.bullets.push({
        pos: { ...b.pos },
        vel: { x: Math.cos(a) * 200, y: Math.sin(a) * 200 },
        damage: 10,
        life: 3,
        friendly: false,
        color: "#aa66ff",
        radius: 5,
      });
    }
    
    // High-speed aimed shots
    const base = Math.atan2(s.player.pos.y - b.pos.y, s.player.pos.x - b.pos.x);
    for (let i = 0; i < 4; i++) {
      const a = base + (Math.random() - 0.5) * 0.15;
      s.bullets.push({
        pos: { ...b.pos },
        vel: { x: Math.cos(a) * 450, y: Math.sin(a) * 450 },
        damage: 16,
        life: 2,
        friendly: false,
        color: "#ff2222",
        radius: 8,
      });
    }
    
    // Spore cloud (damage over time in area)
    const cloudAngle = Math.random() * Math.PI * 2;
    const cloudDist = 150 + Math.random() * 100;
    const cloudPos = {
      x: s.player.pos.x + Math.cos(cloudAngle) * cloudDist,
      y: s.player.pos.y + Math.sin(cloudAngle) * cloudDist,
    };
    
    // Create spore particles that deal damage
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      s.particles.push({
        pos: { ...cloudPos },
        vel: { x: Math.cos(a) * 30, y: Math.sin(a) * 30 },
        life: 2.0,
        color: "#88ff88",
      });
    }
    
    b.attackTimer = 1.0;
  }
}

export function drawHiveMind(ctx: CanvasRenderingContext2D, b: HiveMindBoss) {
  ctx.save();
  ctx.translate(b.pos.x, b.pos.y);
  
  // Pulsing effect
  const pulse = 1 + Math.sin(performance.now() / 300) * 0.08;
  
  // Brain body - organic mass shape
  const bodyColor = b.invulnTimer > 0 ? "#eeeeee" : 
    b.exposed ? "#ffaaaa" :
    b.phase === 3 ? "#888888" : 
    b.phase === 2 ? "#cc8888" : "#ffaaaa";
  
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  
  // Organic brain shape with bumps
  const segments = 12;
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const bumpSize = Math.sin(angle * 3 + performance.now() / 500) * 8;
    const r = (b.radius + bumpSize) * pulse;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  
  // Border
  ctx.strokeStyle = b.exposed ? "#ff4444" : "#cc6666";
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Exposed weak point indicator
  if (b.exposed) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff0000";
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  
  // Eyes
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(-15, -10, 6, 0, Math.PI * 2);
  ctx.arc(15, -10, 6, 0, Math.PI * 2);
  ctx.fill();
  
  // Eye glow
  ctx.fillStyle = "#ff0000";
  ctx.beginPath();
  ctx.arc(-15, -10, 3, 0, Math.PI * 2);
  ctx.arc(15, -10, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Tentacles (visual only)
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 4;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + performance.now() / 1000;
    const tentacleLength = 40 + Math.sin(performance.now() / 300 + i) * 10;
    
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * b.radius, Math.sin(angle) * b.radius);
    ctx.quadraticCurveTo(
      Math.cos(angle + 0.3) * (b.radius + tentacleLength / 2),
      Math.sin(angle + 0.3) * (b.radius + tentacleLength / 2),
      Math.cos(angle) * (b.radius + tentacleLength),
      Math.sin(angle) * (b.radius + tentacleLength)
    );
    ctx.stroke();
  }
  
  ctx.restore();
}
