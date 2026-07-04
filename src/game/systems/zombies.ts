import type { GameState, Zombie, ZombieKind } from "../types";
import { WORLD_W, PLAYER_RADIUS } from "../constants";
import { rand } from "../utils";
import { spark } from "./particles";
import { audio } from "../AudioEngine";

export function spawnZombie(s: GameState) {
  const cam = s.camera;
  const cw = s.canvasWidth;
  const ch = s.canvasHeight;
  let pos = { x: 0, y: 0 };
  for (let tries = 0; tries < 20; tries++) {
    pos = { x: rand(60, WORLD_W - 60), y: rand(60, WORLD_W - 60) };
    const sx = pos.x - cam.x,
      sy = pos.y - cam.y;
    if (sx < -50 || sx > cw + 50 || sy < -50 || sy > ch + 50) break;
  }
  const r = Math.random();
  let z: Zombie;
  if (r < 0.55)
    z = { pos, hp: 40, maxHp: 40, speed: 55, damage: 8, radius: 14, kind: "walker" as ZombieKind };
  else if (r < 0.9)
    z = { pos, hp: 25, maxHp: 25, speed: 110, damage: 6, radius: 12, kind: "runner" as ZombieKind };
  else
    z = {
      pos,
      hp: 140,
      maxHp: 140,
      speed: 45,
      damage: 20,
      radius: 20,
      kind: "brute" as ZombieKind,
    };
  s.zombies.push(z);
}

export function updateZombieAI(s: GameState, dt: number) {
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
        s.toasts.push({ msg: "-" + z.damage + " HP", life: 2.2 });
        audio.playHurt();
      }
    }
  }
}

export function separateZombies(s: GameState) {
  for (let i = 0; i < s.zombies.length; i++) {
    for (let j = i + 1; j < s.zombies.length; j++) {
      const a = s.zombies[i],
        b = s.zombies[j];
      const dx = b.pos.x - a.pos.x,
        dy = b.pos.y - a.pos.y;
      const d = Math.hypot(dx, dy) || 1;
      const min = a.radius + b.radius;
      if (d < min) {
        const push = (min - d) / 2;
        a.pos.x -= (dx / d) * push;
        a.pos.y -= (dy / d) * push;
        b.pos.x += (dx / d) * push;
        b.pos.y += (dy / d) * push;
      }
    }
  }
}

export function removeDeadZombies(s: GameState) {
  const remaining: Zombie[] = [];
  for (const z of s.zombies) {
    if (z.hp <= 0) {
      s.player.cash += z.kind === "brute" ? 60 : z.kind === "runner" ? 25 : 15;
      spark(s, z.pos, "#7a1a1a", 12);
      s.killedInRound++;
    } else remaining.push(z);
  }
  s.zombies = remaining;
}
