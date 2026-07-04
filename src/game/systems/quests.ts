import type { GameState } from "../types";
import { dist, pushToast, refillAmmo, makeSlot, rand } from "../utils";
import { PLAYER_RADIUS, WORLD_W, getWorldWidth, getWorldHeight } from "../constants";
import { audio } from "../AudioEngine";
import { enterArena } from "./boss";
import { spawnZombie } from "./zombies";
import { spark } from "./particles";
import { tryInteractGenerator, getGeneratorInteractHint } from "./generator";
import { tryInteractLabVault, tryPickupLabKey, getLabVaultInteractHint, getLabKeyInteractHint } from "./labvault";
import { spawnMiniBoss, updateMiniBoss, drawMiniBoss } from "./miniboss";
import { getMapConfig } from "../maps";

export function updateInteractHint(s: GameState) {
  s.interactHint = "";
  s.interactTarget = null;
  
  if (s.inArena) {
    for (const st of s.stations) {
      if (dist(s.player.pos, st.pos) < 60) {
        const owned = s.player.inventory.some((slot) => slot.weapon.id === st.weapon.id);
        s.interactHint = owned
          ? `${st.weapon.name} owned — refill ammo`
          : `Buy ${st.weapon.name} — $${st.weapon.cost}`;
        s.interactTarget = { kind: "station", ref: st };
        break;
      }
    }
    if (!s.interactTarget) {
      const worldW = getWorldWidth(s.selectedMap);
      const worldH = getWorldHeight(s.selectedMap);
      if (dist(s.player.pos, { x: worldW / 2, y: worldH / 2 }) < 60) {
        s.interactHint = "Ammo Refill Crate";
        s.interactTarget = { kind: "ammo-crate", ref: null };
      }
    }
  } else {
    // Check generator first (hospital map)
    if (s.selectedMap === "hospital" && s.generator && !s.powerOn) {
      const genHint = getGeneratorInteractHint(s);
      if (genHint) {
        s.interactHint = genHint;
        s.interactTarget = { kind: "generator", ref: s.generator };
      }
    }
    
    // Check lab keys (hospital map)
    if (!s.interactTarget && s.selectedMap === "hospital") {
      const keyHint = getLabKeyInteractHint(s);
      if (keyHint) {
        s.interactHint = keyHint;
        s.interactTarget = { kind: "worldobject", ref: null };
      }
    }
    
    // Check vault (hospital map)
    if (!s.interactTarget && s.selectedMap === "hospital") {
      const vaultHint = getLabVaultInteractHint(s);
      if (vaultHint) {
        s.interactHint = vaultHint;
        s.interactTarget = { kind: "worldobject", ref: null };
      }
    }
    
    if (!s.interactTarget) {
      for (const st of s.stations) {
        if (dist(s.player.pos, st.pos) < 60) {
          const owned = s.player.inventory.some((slot) => slot.weapon.id === st.weapon.id);
          s.interactHint = owned
            ? `${st.weapon.name} owned — refill ammo`
            : `Buy ${st.weapon.name} — $${st.weapon.cost}`;
          s.interactTarget = { kind: "station", ref: st };
          break;
        }
      }
    }
    
    if (!s.interactTarget) {
      for (const n of s.npcs) {
        if (dist(s.player.pos, n.pos) < 55) {
          s.interactHint = `${n.name}: "Greetings"`;
          s.interactTarget = { kind: "npc", ref: n };
          break;
        }
      }
    }
    
    if (!s.interactTarget && dist(s.player.pos, s.gate) < 70) {
      // Find the gate step: last "reach" quest step in the main quest
      const gateStep = s.mainQuest.filter(q => q.type === "reach").pop();
      if (gateStep && !gateStep.done) {
        // Check if previous steps are done
        const prevStepsDone = s.mainQuest.slice(0, s.mainQuest.indexOf(gateStep)).every(q => q.done);
        if (prevStepsDone) {
          s.interactHint = "Enter the Boss Arena";
          s.interactTarget = { kind: "gate", ref: null };
        } else {
          s.interactHint = "Gate — sealed";
        }
      }
    }
  }
}

export function tryInteract(s: GameState, forceUi: () => void) {
  if (!s.interactTarget) return;
  const t = s.interactTarget;
  
  if (t.kind === "generator") {
    tryInteractGenerator(s);
    forceUi();
    return;
  }
  
  if (t.kind === "worldobject") {
    // Try lab key pickup
    if (s.selectedMap === "hospital") {
      const keys = [
        { pos: { x: 300, y: 1300 }, stepId: "k1" },
        { pos: { x: 1700, y: 1300 }, stepId: "k2" },
        { pos: { x: 300, y: 300 }, stepId: "k3" },
      ];
      
      for (let i = 0; i < keys.length; i++) {
        if (tryPickupLabKey(s, i)) {
          forceUi();
          return;
        }
      }
      
      // Try vault interaction
      if (tryInteractLabVault(s)) {
        forceUi();
        return;
      }
    }
  }
  
  if (t.kind === "station") {
    const st = t.ref as {
      weapon: { id: string; name: string; cost: number; magSize: number; reserveMax: number };
      label: string;
      pos: { x: number; y: number };
    };
    const owned = s.player.inventory.some((slot) => slot.weapon.id === st.weapon.id);
    if (owned) {
      const cost = Math.max(20, Math.floor(st.weapon.cost * 0.15));
      if (s.player.cash >= cost) {
        s.player.cash -= cost;
        const slot = s.player.inventory.find((x) => x.weapon.id === st.weapon.id)!;
        slot.reserve = st.weapon.reserveMax;
        slot.ammo = st.weapon.magSize;
        pushToast(s, `Ammo refilled — $${cost}`);
      } else {
        pushToast(s, `Refill costs $${cost}`);
      }
      audio.playInteract();
    } else if (s.player.cash >= st.weapon.cost) {
      s.player.cash -= st.weapon.cost;
      s.player.inventory.push(
        makeSlot(s.stations.find((x) => x.weapon.id === st.weapon.id)!.weapon),
      );
      s.player.weaponIndex = s.player.inventory.length - 1;
      pushToast(s, `Bought ${st.weapon.name}`);
      const buyStep = s.mainQuest.find((q) => q.type === "buy" && !q.done);
      if (buyStep) {
        buyStep.done = true;
        pushToast(s, "Main step complete");
      }
      audio.playInteract();
    } else {
      pushToast(s, "Not enough credits");
      audio.playInteract();
    }
  } else if (t.kind === "npc") {
    const n = t.ref as { sideQuestId?: string };
    const sq = s.sideQuests.find((q) => q.id === n.sideQuestId)!;
    if (!sq.accepted) {
      sq.accepted = true;
      pushToast(s, `Accepted: ${sq.title}`);
      audio.playInteract();
    } else if (sq.steps.every((x) => x.done) && !sq.done) {
      sq.done = true;
      if (sq.reward === "MAX_RESOURCES") {
        s.player.hp = s.player.maxHp;
        pushToast(s, `Reward: Max Health & Ammo!`);
      } else if (sq.reward === "PROTOTYPE_WEAPONS") {
        // Already handled by lab vault
        pushToast(s, `Vault opened!`);
      } else {
        const amount = typeof sq.reward === "number" ? sq.reward : 0;
        s.player.cash += amount;
        pushToast(s, `+$${amount} — ${sq.title} complete`);
      }
      audio.playInteract();
    }
  } else if (t.kind === "gate") {
    const gateStep = s.mainQuest.filter(q => q.type === "reach").pop();
    if (gateStep && !gateStep.done) {
      const prevStepsDone = s.mainQuest.slice(0, s.mainQuest.indexOf(gateStep)).every(q => q.done);
      if (prevStepsDone) {
        gateStep.done = true;
        enterArena(s);
      }
    }
  } else if (t.kind === "ammo-crate") {
    refillAmmo(s, 1.0);
    pushToast(s, "Ammo fully refilled!");
    audio.playInteract();
  }
  forceUi();
}

export function updateReachQuests(s: GameState) {
  for (const q of s.mainQuest) {
    if (q.done || q.type !== "reach" || !q.location) continue;
    const idx = s.mainQuest.indexOf(q);
    if (idx > 0 && !s.mainQuest[idx - 1].done) continue;
    // Skip the last reach step (gate) — handled via interact
    const lastReachStep = s.mainQuest.filter(q => q.type === "reach").pop();
    if (lastReachStep && q === lastReachStep) continue;

    // For hospital map, skip hold timer logic for non-first quests
    if (s.selectedMap === "hospital" && idx === 0) {
      // Hospital first quest is just reach, no hold timer
      if (dist(s.player.pos, q.location) < 55) {
        q.done = true;
        pushToast(s, "Main step complete");
      }
    } else if (idx === 0 && s.selectedMap === "outpost") {
      if (dist(s.player.pos, q.location) < 55) {
        s.holdTimer += 0.016; // approx 60fps dt
        if (s.holdTimer >= 10) {
          q.done = true;
          s.holdTimer = 0;
          pushToast(s, "Main step complete");
        }
      } else {
        s.holdTimer = 0;
      }
    } else if (dist(s.player.pos, q.location) < 55) {
      q.done = true;
      pushToast(s, "Main step complete");
    }
  }
  
  // Handle interact-type quests (like "Turn on Power" in hospital)
  for (const q of s.mainQuest) {
    if (q.done || q.type !== "interact") continue;
    const idx = s.mainQuest.indexOf(q);
    if (idx > 0 && !s.mainQuest[idx - 1].done) continue;
    
    // Power quest is handled by generator system
    if (q.id === "m2" && s.selectedMap === "hospital") {
      if (s.powerOn) {
        q.done = true;
        pushToast(s, "Main step complete");
      }
    }
  }
  
  for (const sq of s.sideQuests) {
    if (!sq.accepted || sq.done) continue;
    for (const st of sq.steps) {
      if (!st.done && st.type === "reach" && st.location && dist(s.player.pos, st.location) < 55) {
        st.done = true;
        pushToast(s, `${sq.title}: objective complete`);
      }
    }
    if ((sq.id === "sq_supply" || sq.id === "sq_supplies") && !sq.done && sq.steps.every((x) => x.done)) {
      sq.done = true;
      const amount = typeof sq.reward === "number" ? sq.reward : 0;
      s.player.cash += amount;
      refillAmmo(s, 0.5);
      pushToast(s, `+$${amount} & ammo refill — ${sq.title} complete`);
      audio.playInteract();
    }
  }
}

export function updateKillQuests(s: GameState) {
  const remainingZombies = [];
  for (const z of s.zombies) {
    if (z.hp <= 0) {
      s.player.cash += z.kind === "brute" ? 60 : z.kind === "runner" ? 25 : 15;
      spark(s, z.pos, "#7a1a1a", 12);
      s.killedInRound++;
      
      // Soul box check - kill zombies near the soul box area
      if (s.selectedMap === "hospital" && !s.soulBoxComplete) {
        const map = getMapConfig(s.selectedMap);
        const soulBoxStep = s.mainQuest.find(q => q.type === "soulbox" && !q.done);
        if (soulBoxStep && map.soulBoxPos && map.soulBoxRadius) {
          const soulBoxDist = dist(z.pos, map.soulBoxPos);
          if (soulBoxDist < map.soulBoxRadius) {
            soulBoxStep.progress = (soulBoxStep.progress ?? 0) + 1;
            // Visual feedback
            for (let i = 0; i < 3; i++) {
              s.particles.push({
                pos: { x: z.pos.x, y: z.pos.y - 20 },
                vel: { x: (Math.random() - 0.5) * 50, y: -80 - Math.random() * 40 },
                life: 0.8,
                color: "#66aaff",
              });
            }
            if (soulBoxStep.progress >= (soulBoxStep.target ?? 0)) {
              soulBoxStep.done = true;
              s.soulBoxComplete = true;
              pushToast(s, "Soul Box charged! Fuel acquired!");
              // Spawn mini boss next round
              s.round++;
              s.killedInRound = 0;
              s.zombiesToKill = 10;
              s.spawnTimer = 1;
              pushToast(s, "The ABOMINATION approaches!");
            }
          }
        }
      }
      
      // main kill quest
      const killStep = s.mainQuest.find((q) => q.type === "kill" && !q.done);
      if (killStep) {
        if (killStep.location) {
          if (dist(z.pos, killStep.location) < 200) {
            killStep.progress = (killStep.progress ?? 0) + 1;
            if (killStep.progress >= (killStep.target ?? 0)) {
              killStep.done = true;
              pushToast(s, "Main step complete");
            }
          }
        } else {
          killStep.progress = (killStep.progress ?? 0) + 1;
          if (killStep.progress >= (killStep.target ?? 0)) {
            killStep.done = true;
            pushToast(s, "Main step complete");
          }
        }
      }
      // side quests
      for (const sq of s.sideQuests) {
        if (!sq.accepted || sq.done) continue;
        for (const st of sq.steps) {
          if (st.done) continue;
          if (st.type === "kill") {
            if (st.location) {
              if (dist(z.pos, st.location) < 200) {
                st.progress = (st.progress ?? 0) + 1;
                if (st.progress >= (st.target ?? 0)) {
                  st.done = true;
                  pushToast(s, `${sq.title}: objective complete`);
                }
              }
            } else {
              if (sq.id === "sq1" && z.kind !== "runner") continue;
              if (sq.id === "sq3" && z.kind !== "brute") continue;
              st.progress = (st.progress ?? 0) + 1;
              if (st.progress >= (st.target ?? 0)) {
                st.done = true;
                pushToast(s, `${sq.title}: objective complete`);
              }
            }
          }
        }
      }
    } else remainingZombies.push(z);
  }
  s.zombies = remainingZombies;
}

export function updateRGBQuest(s: GameState) {
  // Only update RGB quest for outpost map
  if (s.selectedMap !== "outpost") return;
  
  for (const b of s.bullets) {
    if (!b.friendly) continue;
    for (const obj of s.worldObjects) {
      if (!obj.active || obj.locked) continue;
      if (dist(b.pos, obj.pos) < obj.radius + b.radius) {
        b.life = 0;
        // spark inline
        for (let i = 0; i < 6; i++) {
          s.particles.push({
            pos: { ...b.pos },
            vel: { x: (Math.random() - 0.5) * 280, y: (Math.random() - 0.5) * 280 },
            life: 0.2 + Math.random() * 0.3,
            color: obj.color,
          });
        }
        const sq = s.sideQuests.find((q) => q.id === obj.questId);
        if (sq) {
          const currentStepIdx = sq.steps.findIndex((step) => !step.done);
          const targetStep = sq.steps[currentStepIdx];
          if (targetStep && targetStep.id === obj.stepId) {
            targetStep.done = true;
            pushToast(s, "Light activated!");
            if (sq.steps.every((st) => st.done)) {
              sq.done = true;
              s.player.hp = s.player.maxHp;
              pushToast(s, "RGB Sequence complete: MAX HEALTH & AMMO!");
            }
          } else {
            pushToast(s, "Wrong order! Sequence locked until next round.");
            sq.steps.forEach((st) => (st.done = false));
            s.worldObjects.forEach((o) => (o.locked = true));
          }
        }
        break;
      }
    }
  }
}

export function updateRoundSystem(s: GameState, dt: number) {
  if (s.inArena) return;
  s.spawnTimer -= dt;
  const cap = Math.min(5 + s.round * 3, 8);
  const remainingToSpawn = s.zombiesToKill - s.killedInRound - s.zombies.length;
  if (s.spawnTimer <= 0 && s.zombies.length < cap && remainingToSpawn > 0) {
    s.spawnTimer = rand(0.6, 1.4);
    spawnZombie(s);
  }
  if (s.killedInRound >= s.zombiesToKill && s.zombies.length === 0) {
    s.round++;
    s.killedInRound = 0;
    s.zombiesToKill += 5;
    s.spawnTimer = 2;
    s.worldObjects.forEach((obj) => (obj.locked = false));
    pushToast(s, `ROUND ${s.round} BEGINS`);
  }
}
