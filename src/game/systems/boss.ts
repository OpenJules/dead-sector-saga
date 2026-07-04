import type { GameState, Phase } from "../types";
import { WORLD_W, WORLD_H, ARENA_W, ARENA_H } from "../constants";
import { rand } from "../utils";
import { pushToast } from "../utils";
import { audio } from "../AudioEngine";

export function enterArena(s: GameState) {
  s.inArena = true;
  s.zombies = [];
  s.bullets = [];
  s.player.pos = { x: WORLD_W / 2, y: WORLD_H / 2 + 300 };
  s.player.hp = Math.max(s.player.hp, 80);
  s.boss = {
    pos: { x: WORLD_W / 2, y: WORLD_H / 2 - 250 },
    hp: 1500,
    maxHp: 1500,
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

export function updateBoss(s: GameState, dt: number) {
  const b = s.boss!;
  b.invulnTimer = Math.max(0, b.invulnTimer - dt);
  const p = b.hp / b.maxHp;
  const targetPhase: Phase = p > 0.66 ? 1 : p > 0.33 ? 2 : 3;
  if (targetPhase > b.phase) {
    b.phase = targetPhase;
    b.invulnTimer = 1.2;
    pushToast(s, `Phase ${b.phase}!`);
    s.player.hp = Math.min(s.player.maxHp, s.player.hp + 25);
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
  const dx = b.target.x - b.pos.x,
    dy = b.target.y - b.pos.y;
  const d = Math.hypot(dx, dy) || 1;
  const spd = b.phase === 1 ? 60 : b.phase === 2 ? 95 : 130;
  b.pos.x += (dx / d) * spd * dt;
  b.pos.y += (dy / d) * spd * dt;

  // Attacks
  b.attackTimer -= dt;
  if (b.attackTimer <= 0) {
    if (b.phase === 1) {
      const base = Math.atan2(s.player.pos.y - b.pos.y, s.player.pos.x - b.pos.x);
      for (let i = -2; i <= 2; i++) {
        const a = base + i * 0.14;
        s.bullets.push({
          pos: { ...b.pos },
          vel: { x: Math.cos(a) * 320, y: Math.sin(a) * 320 },
          damage: 10,
          life: 3,
          friendly: false,
          color: "#ff5a5a",
          radius: 6,
        });
      }
      b.attackTimer = 1.6;
    } else if (b.phase === 2) {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + s.time;
        s.bullets.push({
          pos: { ...b.pos },
          vel: { x: Math.cos(a) * 260, y: Math.sin(a) * 260 },
          damage: 12,
          life: 2.5,
          friendly: false,
          color: "#ffa04a",
          radius: 6,
        });
      }
      if (s.zombies.length < 6) {
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2;
          s.zombies.push({
            pos: { x: b.pos.x + Math.cos(a) * 90, y: b.pos.y + Math.sin(a) * 90 },
            hp: 25,
            maxHp: 25,
            speed: 130,
            damage: 8,
            radius: 12,
            kind: "runner",
          });
        }
      }
      b.attackTimer = 2.2;
    } else {
      const base = Math.atan2(s.player.pos.y - b.pos.y, s.player.pos.x - b.pos.x);
      for (let i = 0; i < 3; i++) {
        const a = base + (Math.random() - 0.5) * 0.15;
        s.bullets.push({
          pos: { ...b.pos },
          vel: { x: Math.cos(a) * 460, y: Math.sin(a) * 460 },
          damage: 14,
          life: 2.5,
          friendly: false,
          color: "#ff2a2a",
          radius: 7,
        });
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + s.time * 3;
        s.bullets.push({
          pos: { ...b.pos },
          vel: { x: Math.cos(a) * 220, y: Math.sin(a) * 220 },
          damage: 10,
          life: 3,
          friendly: false,
          color: "#c86aff",
          radius: 6,
        });
      }
      b.attackTimer = 1.1;
    }
  }
}
