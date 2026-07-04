import type { GameState } from "../types";
import { dist, pushToast } from "../utils";
import { audio } from "../AudioEngine";
import { WEAPONS } from "../constants";

const FRICTION = 0.97;
const MIN_SPEED = 5;
const RESTITUTION = 0.7;

export function updateMiniGolf(s: GameState, dt: number) {
  if (!s.miniGolf || s.miniGolf.complete) return;

  for (const ball of s.miniGolf.balls) {
    if (ball.inHole || !ball.active) continue;

    const speed = Math.hypot(ball.vel.x, ball.vel.y);
    if (speed < MIN_SPEED) {
      ball.vel.x = 0;
      ball.vel.y = 0;
      continue;
    }

    ball.pos.x += ball.vel.x * dt;
    ball.pos.y += ball.vel.y * dt;

    ball.vel.x *= FRICTION;
    ball.vel.y *= FRICTION;

    const b = s.miniGolf.bounds;
    if (ball.pos.x - ball.radius < b.x) {
      ball.pos.x = b.x + ball.radius;
      ball.vel.x = Math.abs(ball.vel.x) * RESTITUTION;
    }
    if (ball.pos.x + ball.radius > b.x + b.width) {
      ball.pos.x = b.x + b.width - ball.radius;
      ball.vel.x = -Math.abs(ball.vel.x) * RESTITUTION;
    }
    if (ball.pos.y - ball.radius < b.y) {
      ball.pos.y = b.y + ball.radius;
      ball.vel.y = Math.abs(ball.vel.y) * RESTITUTION;
    }
    if (ball.pos.y + ball.radius > b.y + b.height) {
      ball.pos.y = b.y + b.height - ball.radius;
      ball.vel.y = -Math.abs(ball.vel.y) * RESTITUTION;
    }

    for (const wall of s.miniGolf.walls) {
      const closestX = Math.max(wall.x, Math.min(ball.pos.x, wall.x + wall.width));
      const closestY = Math.max(wall.y, Math.min(ball.pos.y, wall.y + wall.height));
      const dx = ball.pos.x - closestX;
      const dy = ball.pos.y - closestY;
      const d = Math.hypot(dx, dy);

      if (d < ball.radius) {
        if (d === 0) {
          const centerX = wall.x + wall.width / 2;
          const centerY = wall.y + wall.height / 2;
          const pushX = ball.pos.x - centerX;
          const pushY = ball.pos.y - centerY;
          const pushDist = Math.hypot(pushX, pushY) || 1;
          ball.pos.x += (pushX / pushDist) * ball.radius;
          ball.pos.y += (pushY / pushDist) * ball.radius;
        } else {
          const nx = dx / d;
          const ny = dy / d;
          ball.pos.x = closestX + nx * ball.radius;
          ball.pos.y = closestY + ny * ball.radius;
          const dot = ball.vel.x * nx + ball.vel.y * ny;
          ball.vel.x = (ball.vel.x - 2 * dot * nx) * RESTITUTION;
          ball.vel.y = (ball.vel.y - 2 * dot * ny) * RESTITUTION;
        }
      }
    }

    for (const hole of s.miniGolf.holes) {
      if (hole.ballInHole) continue;
      if (dist(ball.pos, hole.pos) < hole.radius) {
        ball.inHole = true;
        ball.active = false;
        ball.vel.x = 0;
        ball.vel.y = 0;
        ball.pos.x = hole.pos.x;
        ball.pos.y = hole.pos.y;
        hole.ballInHole = true;

        const sq = s.sideQuests.find((q) => q.id === "sq_minigolf");
        if (sq) {
          const stepId = hole.id === 0 ? "mg2" : "mg3";
          const step = sq.steps.find((st) => st.id === stepId);
          if (step && !step.done) {
            step.done = true;
            pushToast(s, `Ball ${hole.id + 1} sunk!`);
            audio.playInteract();
          }
        }

        for (let i = 0; i < 10; i++) {
          s.particles.push({
            pos: { x: hole.pos.x, y: hole.pos.y },
            vel: { x: (Math.random() - 0.5) * 100, y: -60 - Math.random() * 40 },
            life: 0.6,
            color: "#44ff44",
          });
        }
        break;
      }
    }
  }

  const allSunk = s.miniGolf.holes.every((h) => h.ballInHole);
  if (allSunk && !s.miniGolf.complete) {
    s.miniGolf.complete = true;
    const sq = s.sideQuests.find((q) => q.id === "sq_minigolf");
    if (sq && !sq.done) {
      sq.done = true;
        if (sq.reward === "FREE_WEAPON") {
        const ownedIds = s.player.inventory.map((slot) => slot.weapon.id);
        const allWeaponIds = ["pistol", "smg", "shotgun", "rifle", "plasma"];
        const freeWeaponId = allWeaponIds.find((id) => !ownedIds.includes(id));
        if (freeWeaponId) {
          const weapon = WEAPONS[freeWeaponId];
          if (weapon) {
            s.player.inventory.push({
              weapon,
              ammo: weapon.magSize,
              reserve: weapon.reserveMax,
            });
            pushToast(s, `Mini Golf complete! Free ${weapon.name} unlocked!`);
            audio.playInteract();
          }
        } else {
          s.player.cash += 500;
          pushToast(s, "Mini Golf complete! +$500!");
          audio.playInteract();
        }
      } else {
        const amount = typeof sq.reward === "number" ? sq.reward : 0;
        s.player.cash += amount;
        pushToast(s, `Mini Golf complete! +$${amount}`);
        audio.playInteract();
      }
    }
  }
}
