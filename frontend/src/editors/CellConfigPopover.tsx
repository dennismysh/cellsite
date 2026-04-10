import { useState, type FormEvent } from "react";
import type { Cell, CellCreateInput, CellType } from "@cellsite/shared";
import { CELL_TYPES } from "@cellsite/shared";

const ICONS = ["🖊️", "🎨", "🎵", "📄", "📊", "✨", "🐙", "⭐", "💡", "🔗", "📚", "🎬"];

interface CellConfigPopoverProps {
  position: { row: number; col: number };
  cell?: Cell;
  onSave: (input: CellCreateInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function CellConfigPopover({
  position,
  cell,
  onSave,
  onCancel,
  onDelete,
}: CellConfigPopoverProps) {
  const [title, setTitle] = useState(cell?.title ?? "");
  const [subtitleJa, setSubtitleJa] = useState(cell?.subtitleJa ?? "");
  const [type, setType] = useState<CellType>(cell?.type ?? "external");
  const [icon, setIcon] = useState(cell?.icon ?? ICONS[0]);
  const [externalUrl, setExternalUrl] = useState(cell?.externalUrl ?? "");
  const [rowSpan, setRowSpan] = useState(cell?.rowSpan ?? 1);
  const [colSpan, setColSpan] = useState(cell?.colSpan ?? 1);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      row: position.row,
      col: position.col,
      rowSpan,
      colSpan,
      type,
      title,
      subtitleJa: subtitleJa || null,
      icon,
      externalUrl: type === "external" ? externalUrl : null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-base/60 flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-lg p-6 w-full max-w-md shadow-2xl"
      >
        <h3 className="text-text text-lg font-medium mb-4">
          {cell ? "Edit Cell" : "Configure Cell"}
        </h3>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-text-muted">Type</span>
            <select
              aria-label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as CellType)}
              className="w-full mt-1 bg-base border border-border rounded px-2 py-1 text-text"
            >
              {CELL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-text-muted">Title</span>
            <input
              aria-label="Title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 bg-base border border-border rounded px-2 py-1 text-text"
            />
          </label>

          <label className="block">
            <span className="text-text-muted">Japanese subtitle (optional)</span>
            <input
              aria-label="Japanese subtitle"
              type="text"
              value={subtitleJa}
              onChange={(e) => setSubtitleJa(e.target.value)}
              className="w-full mt-1 bg-base border border-border rounded px-2 py-1 text-text font-jp"
            />
          </label>

          <label className="block">
            <span className="text-text-muted">Icon</span>
            <select
              aria-label="Icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full mt-1 bg-base border border-border rounded px-2 py-1 text-text"
            >
              {ICONS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>

          {type === "external" && (
            <label className="block">
              <span className="text-text-muted">External URL</span>
              <input
                aria-label="External URL"
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="w-full mt-1 bg-base border border-border rounded px-2 py-1 text-text"
                placeholder="https://..."
              />
            </label>
          )}

          <div className="flex gap-3">
            <label className="block flex-1">
              <span className="text-text-muted">Col span</span>
              <input
                aria-label="Column span"
                type="number"
                min={1}
                value={colSpan}
                onChange={(e) => setColSpan(Number(e.target.value))}
                className="w-full mt-1 bg-base border border-border rounded px-2 py-1 text-text"
              />
            </label>
            <label className="block flex-1">
              <span className="text-text-muted">Row span</span>
              <input
                aria-label="Row span"
                type="number"
                min={1}
                value={rowSpan}
                onChange={(e) => setRowSpan(Number(e.target.value))}
                className="w-full mt-1 bg-base border border-border rounded px-2 py-1 text-text"
              />
            </label>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2 border border-border rounded text-text-muted hover:text-accent mr-auto"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-border rounded text-text-muted hover:text-text"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-accent text-base rounded font-medium"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
