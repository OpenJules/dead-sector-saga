import type { Vec, Weapon, WeaponSlot, GameState } from "./types";

export const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
export const clamp = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v));
export const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function makeSlot(w: Weapon): WeaponSlot {
  return { weapon: w, ammo: w.magSize, reserve: w.reserveMax };
}

export function refillAmmo(s: GameState, fraction = 1) {
  for (const slot of s.player.inventory) {
    slot.reserve = Math.min(
      slot.weapon.reserveMax,
      slot.reserve + Math.ceil(slot.weapon.reserveMax * fraction),
    );
  }
}

export function formatTime(t: number) {
  const total = Math.max(0, t);
  const m = Math.floor(total / 60);
  const sec = Math.floor(total % 60);
  const cs = Math.floor((total * 100) % 100);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

export function pushToast(s: GameState, msg: string) {
  s.toasts.push({ msg, life: 2.2 });
}
