import { useEffect } from "react";
import type { Cell } from "@cellsite/shared";

interface ExpandedCellProps {
  cell: Cell;
  onClose: () => void;
  onOpen: (cell: Cell) => void;
}

export function ExpandedCell({ cell, onClose, onOpen }: ExpandedCellProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-base/80 backdrop-blur-sm z-30 flex items-center justify-center p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-surface border border-border rounded-lg max-w-lg w-full p-8 shadow-2xl animate-[expand_180ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl text-center mb-4">{cell.icon}</div>
        <h2 className="text-accent text-2xl font-medium text-center">
          {cell.title}
        </h2>
        {cell.subtitleJa && (
          <p className="text-text-muted text-center font-jp mt-1">
            {cell.subtitleJa}
          </p>
        )}
        <div className="text-text text-sm text-center mt-6">
          {cell.type === "external" && cell.externalUrl ? (
            <span className="text-text-muted break-all">{cell.externalUrl}</span>
          ) : (
            <span className="text-text-muted italic">
              Content type: {cell.type}
            </span>
          )}
        </div>
        <div className="flex gap-2 justify-center mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded text-text-muted hover:text-text"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onOpen(cell)}
            className="px-4 py-2 bg-accent text-base rounded font-medium"
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
}
