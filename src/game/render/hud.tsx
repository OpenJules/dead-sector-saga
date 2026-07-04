import type { GameState } from "../types";
import { formatTime } from "../utils";

export function HUD({ s }: { s: GameState }) {
  const activeSlot = s.player.inventory[s.player.weaponIndex];
  const activeWeapon = activeSlot.weapon;
  const isReloading =
    s.player.reloadingSlot === s.player.weaponIndex && s.time < s.player.reloadUntil;
  const reloadPct = isReloading
    ? 1 - Math.max(0, (s.player.reloadUntil - s.time) / activeWeapon.reloadTime)
    : 0;

  return (
    <div className="pointer-events-none absolute inset-0 p-4 font-mono text-sm">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Health / Weapon / Cash */}
        <div className="pointer-events-auto rounded-md border border-border bg-card/80 p-3 backdrop-blur">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">HP</span>
            <div className="h-3 w-40 overflow-hidden rounded-sm border border-border bg-background">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${(s.player.hp / s.player.maxHp) * 100}%` }}
              />
            </div>
            <span className="text-xs">
              {Math.max(0, Math.ceil(s.player.hp))}/{s.player.maxHp}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            CREDITS: <span className="text-hud">${s.player.cash}</span>
          </div>
          <div className="mt-1 text-xs">
            <span className="text-muted-foreground">WEAPON:</span>{" "}
            <span style={{ color: activeWeapon.color }}>{activeWeapon.name}</span>
          </div>
          <div className="mt-1 text-xs">
            <span className="text-muted-foreground">AMMO:</span>{" "}
            {isReloading ? (
              <span className="text-accent">RELOADING</span>
            ) : (
              <span className="text-hud">
                {activeSlot.ammo}
                <span className="text-muted-foreground">/{activeWeapon.magSize}</span>{" "}
                <span className="text-muted-foreground">[{activeSlot.reserve}]</span>
              </span>
            )}
            <span className="ml-2 text-[10px] text-muted-foreground">R to reload</span>
          </div>
          {isReloading && (
            <div className="mt-1 h-1 w-40 overflow-hidden rounded-sm bg-background">
              <div className="h-full bg-accent" style={{ width: `${reloadPct * 100}%` }} />
            </div>
          )}
          <div className="mt-1 flex gap-1">
            {s.player.inventory.map((slot, i) => (
              <span
                key={slot.weapon.id}
                className={`rounded-sm border px-1.5 py-0.5 text-[10px] ${i === s.player.weaponIndex ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
              >
                {slot.weapon.name.split(" ")[0]}
              </span>
            ))}
          </div>
          
          {/* Hospital map status indicators */}
          {s.selectedMap === "hospital" && (
            <div className="mt-2 border-t border-border pt-2">
              <div className="text-xs">
                <span className="text-muted-foreground">POWER:</span>{" "}
                <span className={s.powerOn ? "text-green-400" : "text-red-400"}>
                  {s.powerOn ? "ON" : "OFF"}
                </span>
              </div>
              {s.flashlightOn && (
                <div className="text-xs">
                  <span className="text-muted-foreground">FLASHLIGHT:</span>{" "}
                  <span className="text-blue-400">ON</span>
                </div>
              )}
              {s.labKeysFound > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">LAB KEYS:</span>{" "}
                  <span className="text-cyan-400">{s.labKeysFound}/3</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Round Counter + Timer */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
          <div className="text-4xl font-bold text-accent tracking-tighter italic">
            ROUND {s.round}
          </div>
          <div className="text-xs text-muted-foreground">
            KILLS: {s.killedInRound}/{s.zombiesToKill}
          </div>
          <div className="mt-1 font-mono text-lg tabular-nums text-hud">{formatTime(s.time)}</div>
        </div>

        {/* Right: Quests */}
        <div className="pointer-events-auto max-w-sm rounded-md border border-border bg-card/80 p-3 backdrop-blur">
          <div className="mb-1 text-xs uppercase tracking-widest text-primary">Main Quest</div>
          <ul className="space-y-1 text-xs">
            {s.mainQuest.map((q) => (
              <li
                key={q.id}
                className={q.done ? "text-muted-foreground line-through" : "text-foreground"}
              >
                • {q.text}
                {q.type === "kill" ? ` (${q.progress}/${q.target})` : ""}
              </li>
            ))}
          </ul>
          {s.sideQuests.some((q) => q.accepted && !q.done) && (
            <>
              <div className="mb-1 mt-2 text-xs uppercase tracking-widest text-toxic">
                Side Quests
              </div>
              <ul className="space-y-1 text-xs">
                {s.sideQuests
                  .filter((q) => q.accepted && !q.done)
                  .map((q) => (
                    <li key={q.id}>
                      • {q.title}: {q.steps[0].text}
                      {q.steps[0].type === "kill"
                        ? ` (${q.steps[0].progress}/${q.steps[0].target})`
                        : ""}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Bottom center hint */}
      {s.interactHint && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-md border border-primary bg-card/90 px-4 py-2 text-sm text-primary shadow-lg">
          [E] {s.interactHint}
        </div>
      )}

      {/* Boss HP */}
      {s.inArena && s.boss && (
        <div className="absolute bottom-4 left-1/2 w-[520px] -translate-x-1/2">
          <div className="mb-1 text-center text-xs uppercase tracking-widest text-accent">
            {s.boss.type === "hivemind" ? "THE HIVE MIND" : "THE HARVESTER"} — Phase {s.boss.phase}/3
          </div>
          <div className="h-4 overflow-hidden rounded-sm border border-accent bg-background">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${(s.boss.hp / s.boss.maxHp) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1">
        {s.toasts.map((t, i) => (
          <div
            key={i}
            className="rounded-md border border-border bg-card/90 px-3 py-1 text-xs text-hud shadow"
          >
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
