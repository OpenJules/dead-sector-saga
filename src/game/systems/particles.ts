import type { GameState, Particle, Vec } from "../types";
import { rand } from "../utils";

export function spark(s: GameState, pos: Vec, color: string, n = 6) {
  for (let i = 0; i < n; i++) {
    s.particles.push({
      pos: { ...pos },
      vel: { x: rand(-140, 140), y: rand(-140, 140) },
      life: rand(0.2, 0.5),
      color,
    });
  }
}

export function updateParticles(s: GameState, dt: number) {
  for (const p of s.particles) {
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
    p.vel.x *= 0.9;
    p.vel.y *= 0.9;
    p.life -= dt;
  }
  s.particles = s.particles.filter((p) => p.life > 0);
}
