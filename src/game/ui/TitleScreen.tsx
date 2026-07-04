export function TitleScreen({ onStart }: { onStart: () => void }) {
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
          A top-down zombie shooter. Complete the main quest, take side jobs, and enter the
          underworld arena to face The Harvester's three-phase assault.
        </p>
        <button
          onClick={onStart}
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
