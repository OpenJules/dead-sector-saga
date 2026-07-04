import { useEffect, useRef, useState, useCallback } from "react";
import { audio } from "./AudioEngine";
import { createInitialState } from "./state";
import { formatTime } from "./utils";
import {
  updatePlayer,
  updatePlayerAim,
  tryShoot,
  startReload,
  finishReloadIfDue,
  switchWeapon,
} from "./systems/player";
import { updateCamera } from "./systems/camera";
import { updateZombieAI, separateZombies, removeDeadZombies } from "./systems/zombies";
import { updateBullets } from "./systems/bullets";
import { updateBoss } from "./systems/boss";
import {
  updateInteractHint,
  tryInteract,
  updateReachQuests,
  updateKillQuests,
  updateRGBQuest,
  updateRoundSystem,
} from "./systems/quests";
import { updateParticles } from "./systems/particles";
import { render } from "./render/index";
import { HUD } from "./render/hud";
import { TitleScreen } from "./ui/TitleScreen";
import { Overlay } from "./ui/Overlay";

export default function DeadSectorGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [uiTick, setUiTick] = useState(0);
  const [screen, setScreen] = useState<"title" | "playing" | "dead" | "win">("title");
  const stateRef = useRef(createInitialState());

  const forceUi = useCallback(() => setUiTick((n) => n + 1), []);

  // Input
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === "e") tryInteract(stateRef.current, forceUi);
      if (e.key.toLowerCase() === "r") startReload(stateRef.current);
      if (e.key.toLowerCase() === "q") {
        const s = stateRef.current;
        const nextIndex = (s.player.weaponIndex + 1) % s.player.inventory.length;
        switchWeapon(s, nextIndex);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [forceUi]);

  // Mouse
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const onMove = (e: MouseEvent) => {
      const r = c.getBoundingClientRect();
      stateRef.current.mouse.x = (e.clientX - r.left) * (c.width / r.width);
      stateRef.current.mouse.y = (e.clientY - r.top) * (c.height / r.height);
    };
    const onDown = () => {
      stateRef.current.mouse.down = true;
    };
    const onUp = () => {
      stateRef.current.mouse.down = false;
    };
    c.addEventListener("mousemove", onMove);
    c.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    return () => {
      c.removeEventListener("mousemove", onMove);
      c.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (screen !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = performance.now();
    let uiCounter = 0;

    audio.resume().then(() => {
      if (stateRef.current.inArena) {
        audio.playMusic("boss");
      } else {
        audio.playMusic("main");
      }
    });

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const s = stateRef.current;

      // Sync canvas dimensions into state
      s.canvasWidth = canvas.width;
      s.canvasHeight = canvas.height;

      s.time += dt;

      // Update
      finishReloadIfDue(s);
      updatePlayer(s, dt);
      updateCamera(s);
      updatePlayerAim(s);
      if (s.mouse.down) tryShoot(s);
      updateInteractHint(s);
      updateReachQuests(s);
      updateRoundSystem(s, dt);
      updateZombieAI(s, dt);
      s.player.invuln = Math.max(0, s.player.invuln - dt);
      separateZombies(s);
      updateBullets(s, dt);
      updateKillQuests(s);
      updateRGBQuest(s);
      updateParticles(s, dt);

      // Toasts
      for (const t of s.toasts) t.life -= dt;
      s.toasts = s.toasts.filter((t) => t.life > 0).slice(-4);

      // Boss
      if (s.inArena && s.boss) updateBoss(s, dt);

      // Render
      render(ctx, canvas, s);

      if (s.player.hp <= 0) {
        setScreen("dead");
        return;
      }
      if (s.won) {
        setScreen("win");
        return;
      }
      uiCounter++;
      if (uiCounter % 10 === 0) forceUi();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [screen, forceUi]);

  // Resize
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const resize = () => {
      c.width = c.clientWidth;
      c.height = c.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      if (screen !== "playing") {
        audio.stopMusic();
      }
    };
  }, [screen]);

  const s = stateRef.current;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      <canvas ref={canvasRef} className="block h-screen w-screen cursor-crosshair" />

      {screen === "title" && (
        <TitleScreen
          onStart={() => {
            stateRef.current = createInitialState();
            setScreen("playing");
          }}
        />
      )}
      {screen === "dead" && (
        <Overlay
          title="YOU DIED"
          subtitle={`The sector claims another. Time: ${formatTime(s.time)}`}
          action="Retry"
          onAction={() => {
            stateRef.current = createInitialState();
            setScreen("playing");
          }}
        />
      )}
      {screen === "win" && (
        <Overlay
          title="SECTOR CLEARED"
          subtitle={`The underworld falls silent. Clear time: ${formatTime(s.time)}`}
          action="Play Again"
          onAction={() => {
            stateRef.current = createInitialState();
            setScreen("playing");
          }}
        />
      )}

      {screen === "playing" && <HUD s={s} />}
    </div>
  );
}
