import type { GameState } from "../types";
import { WORLD_W, WORLD_H, ARENA_W, ARENA_H, PLAYER_SPEED, PLAYER_RADIUS, getWorldWidth, getWorldHeight, getArenaWidth, getArenaHeight } from "../constants";
import { clamp } from "../utils";
import { audio } from "../AudioEngine";

export function updatePlayer(s: GameState, dt: number) {
  const speed = PLAYER_SPEED;
  const mv = { x: 0, y: 0 };
  if (s.keys["w"] || s.keys["arrowup"]) mv.y -= 1;
  if (s.keys["s"] || s.keys["arrowdown"]) mv.y += 1;
  if (s.keys["a"] || s.keys["arrowleft"]) mv.x -= 1;
  if (s.keys["d"] || s.keys["arrowright"]) mv.x += 1;
  const len = Math.hypot(mv.x, mv.y) || 1;
  s.player.pos.x += (mv.x / len) * speed * dt;
  s.player.pos.y += (mv.y / len) * speed * dt;

  const worldW = getWorldWidth(s.selectedMap);
  const worldH = getWorldHeight(s.selectedMap);
  const arenaW = getArenaWidth(s.selectedMap);
  const arenaH = getArenaHeight(s.selectedMap);
  
  const bounds = s.inArena
    ? {
        minX: (worldW - arenaW) / 2,
        minY: (worldH - arenaH) / 2,
        maxX: (worldW + arenaW) / 2,
        maxY: (worldH + arenaH) / 2,
      }
    : { minX: 40, minY: 40, maxX: worldW - 40, maxY: worldH - 40 };
  s.player.pos.x = clamp(s.player.pos.x, bounds.minX + PLAYER_RADIUS, bounds.maxX - PLAYER_RADIUS);
  s.player.pos.y = clamp(s.player.pos.y, bounds.minY + PLAYER_RADIUS, bounds.maxY - PLAYER_RADIUS);

  s.player.invuln = Math.max(0, s.player.invuln - dt);
}

export function updatePlayerAim(s: GameState) {
  const worldMouse = { x: s.mouse.x + s.camera.x, y: s.mouse.y + s.camera.y };
  s.player.aim = Math.atan2(worldMouse.y - s.player.pos.y, worldMouse.x - s.player.pos.x);
}

export function tryShoot(s: GameState) {
  const slot = s.player.inventory[s.player.weaponIndex];
  const w = slot.weapon;
  const now = performance.now();
  if (s.player.reloadingSlot === s.player.weaponIndex && s.time < s.player.reloadUntil) return;
  if (now - s.player.lastShot < w.fireRate) return;
  if (slot.ammo <= 0) {
    if (slot.reserve > 0) startReload(s);
    return;
  }
  s.player.lastShot = now;
  slot.ammo -= 1;
  audio.playShoot(w.id);
  for (let i = 0; i < w.bulletsPerShot; i++) {
    const a = s.player.aim + (Math.random() - 0.5) * w.spread * 2;
    s.bullets.push({
      pos: {
        x: s.player.pos.x + Math.cos(s.player.aim) * 18,
        y: s.player.pos.y + Math.sin(s.player.aim) * 18,
      },
      vel: { x: Math.cos(a) * w.bulletSpeed, y: Math.sin(a) * w.bulletSpeed },
      damage: w.damage,
      life: 1.2,
      friendly: true,
      color: w.color,
      radius: 3,
    });
  }
  if (slot.ammo === 0 && slot.reserve > 0) startReload(s);
}

export function startReload(s: GameState) {
  const idx = s.player.weaponIndex;
  const slot = s.player.inventory[idx];
  if (slot.ammo >= slot.weapon.magSize || slot.reserve <= 0) return;
  if (s.player.reloadingSlot === idx && s.time < s.player.reloadUntil) return;
  s.player.reloadingSlot = idx;
  s.player.reloadUntil = s.time + slot.weapon.reloadTime;
}

export function finishReloadIfDue(s: GameState) {
  if (s.player.reloadingSlot < 0) return;
  if (s.time < s.player.reloadUntil) return;
  const slot = s.player.inventory[s.player.reloadingSlot];
  if (!slot) {
    s.player.reloadingSlot = -1;
    return;
  }
  const need = slot.weapon.magSize - slot.ammo;
  const take = Math.min(need, slot.reserve);
  slot.ammo += take;
  slot.reserve -= take;
  s.player.reloadingSlot = -1;
}

export function switchWeapon(s: GameState, i: number) {
  if (i < s.player.inventory.length) {
    if (s.player.reloadingSlot !== i) s.player.reloadingSlot = -1;
    s.player.weaponIndex = i;
  }
}
