import type { GameState } from "../types";
import { pushToast, dist } from "../utils";
import { audio } from "../AudioEngine";
import { getMapConfig } from "../maps";

const GENERATOR_INTERACT_DISTANCE = 70;

export function updateGenerator(s: GameState) {
  if (!s.generator || s.powerOn) return;
  
  const gen = s.generator;
  const map = getMapConfig(s.selectedMap);
  
  // Check if we need to complete soul box first
  const soulBoxStep = s.mainQuest.find(q => q.type === "soulbox" && !q.done);
  if (soulBoxStep && map.soulBoxPos && map.soulBoxRadius) {
    // Soul box is active - check for kills near the area
    // This is handled in quests.ts updateSoulBox function
  }
  
  // Check if we need to spawn mini boss after soul box
  const miniBossStep = s.mainQuest.find(q => q.type === "killminiboss" && !q.done);
  if (miniBossStep && !s.miniBoss && s.soulBoxComplete && !s.hasGeneratorKey) {
    // Spawn mini boss when soul box is complete
    return; // Will be handled by spawnMiniBoss call
  }
}

export function tryInteractGenerator(s: GameState): boolean {
  if (!s.generator || s.powerOn) return false;
  
  const gen = s.generator;
  const dist = Math.hypot(s.player.pos.x - gen.pos.x, s.player.pos.y - gen.pos.y);
  
  if (dist < GENERATOR_INTERACT_DISTANCE) {
    // Check if soul box is complete
    if (!s.soulBoxComplete) {
      pushToast(s, "Need to complete the Soul Box first!");
      return false;
    }
    
    // Check if we have the generator key
    if (!s.hasGeneratorKey) {
      pushToast(s, "Need the Generator Key! Kill the Abomination!");
      return false;
    }
    
    // Now we can turn on the power
    gen.active = true;
    gen.interacted = true;
    s.powerOn = true;
    
    // Update main quest - find the "Turn on Power" step
    const powerStep = s.mainQuest.find(q => q.type === "interact" && !q.done);
    if (powerStep) {
      powerStep.done = true;
      pushToast(s, "Main step complete");
    }
    
    pushToast(s, "POWER RESTORED");
    audio.playInteract();
    
    return true;
  }
  
  return false;
}

export function getGeneratorInteractHint(s: GameState): string | null {
  if (!s.generator || s.powerOn) return null;
  
  const gen = s.generator;
  const dist = Math.hypot(s.player.pos.x - gen.pos.x, s.player.pos.y - gen.pos.y);
  
  if (dist < GENERATOR_INTERACT_DISTANCE) {
    if (!s.soulBoxComplete) {
      return "Complete the Soul Box first";
    }
    if (!s.hasGeneratorKey) {
      return "Need Generator Key";
    }
    return "Turn on Power";
  }
  
  return null;
}
