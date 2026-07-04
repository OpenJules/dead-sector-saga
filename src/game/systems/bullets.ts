import type { GameState } from "../types";
import { WORLD_W, PLAYER_RADIUS, getWorldWidth, getWorldHeight } from "../constants";
import { dist } from "../utils";
import { spark } from "./particles";
import { audio } from "../AudioEngine";

export function updateBullets(s: GameState, dt: number) {
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
          s.toasts.push({ msg: "-" + b.damage + " HP", life: 2.2 });
          audio.playHurt();
        }
        b.life = 0;
      }
    }
  }

  // Cull off-screen bullets
  const worldW = getWorldWidth(s.selectedMap);
  const worldH = getWorldHeight(s.selectedMap);
  s.bullets = s.bullets.filter(
    (b) =>
      b.life > 0 &&
      b.pos.x > -50 &&
      b.pos.x < worldW + 50 &&
      b.pos.y > -50 &&
      b.pos.y < worldH + 50,
  );
}
