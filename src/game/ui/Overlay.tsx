export function Overlay({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/85 backdrop-blur">
      <div className="text-center">
        <h1
          className="text-6xl tracking-widest text-accent"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
        <button
          onClick={onAction}
          className="mt-6 rounded-md border-2 border-primary bg-primary/10 px-6 py-2 text-primary hover:bg-primary hover:text-primary-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {action}
        </button>
      </div>
    </div>
  );
}
