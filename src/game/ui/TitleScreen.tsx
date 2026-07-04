import { useState } from "react";
import type { MapId } from "../types";
import { getAllMaps } from "../maps";

export function TitleScreen({ onStart }: { onStart: (mapId: MapId) => void }) {
  const [step, setStep] = useState<"title" | "select">("title");
  const [selectedMap, setSelectedMap] = useState<MapId>("outpost");
  const maps = getAllMaps();

  if (step === "select") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur">
        <div className="max-w-2xl text-center">
          <h2
            className="text-4xl tracking-widest text-accent mb-8"
            style={{ fontFamily: "var(--font-display)" }}
          >
            SELECT SECTOR
          </h2>
          <div className="grid grid-cols-2 gap-6 mb-8">
            {maps.map((map) => (
              <button
                key={map.id}
                onClick={() => setSelectedMap(map.id)}
                className={`p-6 rounded-lg border-2 text-left transition ${
                  selectedMap === map.id
                    ? "border-primary bg-primary/20"
                    : "border-muted bg-muted/10 hover:border-muted-foreground/50"
                }`}
              >
                <h3
                  className="text-xl tracking-wider text-foreground mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {map.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">{map.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {map.hasDarkness && (
                    <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
                      DARKNESS
                    </span>
                  )}
                  {map.hasFlashlight && (
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                      FLASHLIGHT
                    </span>
                  )}
                  {map.hasGenerator && (
                    <span className="px-2 py-1 rounded bg-green-500/20 text-green-400">
                      GENERATOR
                    </span>
                  )}
                  <span className="px-2 py-1 rounded bg-red-500/20 text-red-400">
                    {map.bossType === "harvester" ? "THE HARVESTER" : "THE HIVE MIND"}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setStep("title")}
              className="px-6 py-2 rounded-md border border-muted text-muted-foreground hover:bg-muted/20 transition"
            >
              BACK
            </button>
            <button
              onClick={() => onStart(selectedMap)}
              className="px-8 py-3 rounded-md border-2 border-primary bg-primary/10 text-lg tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ENTER THE SECTOR
            </button>
          </div>
          <div className="mt-6 text-[10px] text-muted-foreground">
            WASD move · Mouse aim &amp; fire · E interact · Q switch weapons
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur">
      <div className="max-w-lg text-center">
        <h1
          className="text-6xl tracking-widest text-accent"
          style={{ fontFamily: "var(--font-display)" }}
        >
          DEAD SECTOR
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          A top-down zombie shooter. Complete the main quest, take side jobs, and face the
          horrors that lurk in the shadows.
        </p>
        <button
          onClick={() => setStep("select")}
          className="mt-8 rounded-md border-2 border-primary bg-primary/10 px-8 py-3 text-lg tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          ENTER THE SECTOR
        </button>
        <div className="mt-6 text-[10px] text-muted-foreground">
          WASD move · Mouse aim &amp; fire · E interact · Q switch weapons
        </div>
      </div>
    </div>
  );
}
