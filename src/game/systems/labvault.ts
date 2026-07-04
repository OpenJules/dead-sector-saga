import type { GameState } from "../types";
import { pushToast } from "../utils";
import { audio } from "../AudioEngine";
import { WEAPONS } from "../constants";
import { makeSlot } from "../utils";

const VAULT_POS = { x: 300, y: 300 };
const VAULT_INTERACT_DISTANCE = 60;
const KEY_INTERACT_DISTANCE = 50;

export function updateLabVault(s: GameState) {
  if (s.selectedMap !== "hospital") return;
  if (s.easterEggType !== "labvault") return;
  
  // Check if player is near vault and has all keys
  const vaultDist = Math.hypot(s.player.pos.x - VAULT_POS.x, s.player.pos.y - VAULT_POS.y);
  
  if (vaultDist < VAULT_INTERACT_DISTANCE && s.labKeysFound >= 3) {
    // Can interact with vault
  }
}

export function tryInteractLabVault(s: GameState): boolean {
  if (s.selectedMap !== "hospital") return false;
  
  const vaultDist = Math.hypot(s.player.pos.x - VAULT_POS.x, s.player.pos.y - VAULT_POS.y);
  
  if (vaultDist < VAULT_INTERACT_DISTANCE && s.labKeysFound >= 3) {
    // Open vault and give reward
    s.labKeysFound = 0; // Reset keys
    
    // Remove the lab vault side quest
    const vaultQuest = s.sideQuests.find(q => q.id === "sq_labvault");
    if (vaultQuest) {
      vaultQuest.done = true;
    }
    
    // Give prototype weapons
    const prototypeWeapons = [
      { ...WEAPONS.pistol, id: "proto_pistol", name: "Prototype Pistol", damage: 30, fireRate: 200 },
      { ...WEAPONS.smg, id: "proto_smg", name: "Prototype SMG", damage: 18, fireRate: 80, bulletsPerShot: 3 },
      { ...WEAPONS.shotgun, id: "proto_shotgun", name: "Prototype Shotgun", damage: 24, bulletsPerShot: 8 },
      { ...WEAPONS.rifle, id: "proto_rifle", name: "Prototype Rifle", damage: 90 },
    ];
    
    // Add one random prototype weapon
    const weapon = prototypeWeapons[Math.floor(Math.random() * prototypeWeapons.length)];
    s.player.inventory.push(makeSlot(weapon));
    
    pushToast(s, "VAULT OPENED! Prototype weapon acquired!");
    audio.playInteract();
    
    return true;
  }
  
  return false;
}

export function tryPickupLabKey(s: GameState, keyIndex: number): boolean {
  if (s.selectedMap !== "hospital") return false;
  
  const keys = [
    { pos: { x: 300, y: 1300 }, stepId: "k1" },
    { pos: { x: 1700, y: 1300 }, stepId: "k2" },
    { pos: { x: 300, y: 300 }, stepId: "k3" },
  ];
  
  if (keyIndex < 0 || keyIndex >= keys.length) return false;
  
  const key = keys[keyIndex];
  const dist = Math.hypot(s.player.pos.x - key.pos.x, s.player.pos.y - key.pos.y);
  
  if (dist < KEY_INTERACT_DISTANCE) {
    // Check if already picked up
    const vaultQuest = s.sideQuests.find(q => q.id === "sq_labvault");
    if (vaultQuest) {
      const step = vaultQuest.steps.find(st => st.id === key.stepId);
      if (step && !step.done) {
        step.done = true;
        s.labKeysFound++;
        pushToast(s, `Lab Key Found! (${s.labKeysFound}/3)`);
        audio.playInteract();
        return true;
      }
    }
  }
  
  return false;
}

export function getLabVaultInteractHint(s: GameState): string | null {
  if (s.selectedMap !== "hospital") return null;
  
  const vaultDist = Math.hypot(s.player.pos.x - VAULT_POS.x, s.player.pos.y - VAULT_POS.y);
  
  if (vaultDist < VAULT_INTERACT_DISTANCE) {
    if (s.labKeysFound >= 3) {
      return "[E] Open Vault";
    } else {
      return `Vault Locked (${s.labKeysFound}/3 keys)`;
    }
  }
  
  return null;
}

export function getLabKeyInteractHint(s: GameState): string | null {
  if (s.selectedMap !== "hospital") return null;
  
  const keys = [
    { pos: { x: 300, y: 1300 }, stepId: "k1" },
    { pos: { x: 1700, y: 1300 }, stepId: "k2" },
    { pos: { x: 300, y: 300 }, stepId: "k3" },
  ];
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const dist = Math.hypot(s.player.pos.x - key.pos.x, s.player.pos.y - key.pos.y);
    
    if (dist < KEY_INTERACT_DISTANCE) {
      const vaultQuest = s.sideQuests.find(q => q.id === "sq_labvault");
      if (vaultQuest) {
        const step = vaultQuest.steps.find(st => st.id === key.stepId);
        if (step && !step.done) {
          return "[E] Pick up Lab Key";
        }
      }
    }
  }
  
  return null;
}
