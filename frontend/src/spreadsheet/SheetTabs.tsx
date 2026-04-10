export function SheetTabs() {
  return (
    <div className="flex gap-0.5 bg-surface border-t border-border px-2 py-1 text-xs">
      <span className="bg-base border border-border border-b-0 rounded-t-md px-3 py-1 text-accent">
        Creative
      </span>
      <span className="text-text-muted px-3 py-1 cursor-not-allowed">
        Writing
      </span>
      <span className="text-text-muted px-3 py-1 cursor-not-allowed">Code</span>
    </div>
  );
}
