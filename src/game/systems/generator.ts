import type { GameState } from "../types";
import { pushToast } from "../utils";
import { audio } from "../AudioEngine";

const GENERATOR_INTERACT_DISTANCE = 70;

export function updateGenerator(s: GameState) {
  if (!s.generator || s.powerOn) return;
  
  const gen = s.generator;
  const dist = Math.hypot(s.player.pos.x - gen.pos.x, s.player.pos.y - gen.pos.y);
  
  if (dist < GENERATOR_INTERACT_DISTANCE && !gen.interacted) {
    // Can interact - will be handled by tryInteract
  }
}

export function tryInteractGenerator(s: GameState): boolean {
  if (!s.generator || s.powerOn) return false;
  
  const gen = s.generator;
  const dist = Math.hypot(s.player.pos.x - gen.pos.x, s.player.pos.y - gen.pos.y);
  
  if (dist < GENERATOR_INTERACT_DISTANCE && !gen.interacted) {
    gen.active = true;
    gen.interacted = true;
    s.powerOn = true;
    
    // Update main quest if we're on the "Turn on Power" step
    const currentQuest = s.mainQuest[s.mainIndex];
    if (currentQuest && currentQuest.id === "m2" && currentQuest.type === "interact") {
      currentQuest.done = true;
      s.mainIndex++;
      pushToast(s, "Quest complete: " + currentQuest.text);
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
  
  if (dist < GENERATOR_INTERACT_DISTANCE && !gen.interacted) {
    return "[E] Turn on Power";
  }
  
  return null;
}
