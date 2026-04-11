import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_SHEET } from "@cellsite/shared";
import type { Sheet } from "@cellsite/shared";
import { sheetsApi } from "../lib/sheets.js";
import { useCurrentSheet } from "./useCurrentSheet.js";

const SHEET_NAME_REGEX = /^[\w\- ]{1,40}$/;
const SHEET_NAME_HINT =
  "Sheet name must be 1-40 chars, letters/numbers/spaces/_/- only";

const ACTIVE_TAB_CLASS =
  "bg-base border border-border border-b-0 rounded-t-md px-3 py-1 text-accent";
const INACTIVE_TAB_CLASS =
  "text-text-muted px-3 py-1 hover:text-text transition-colors";

export function SheetTabs() {
  const currentSheet = useCurrentSheet((s) => s.currentSheet);
  const setCurrentSheet = useCurrentSheet((s) => s.setCurrentSheet);
  const queryClient = useQueryClient();

  const {
    data: sheets = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["sheets"],
    queryFn: () => sheetsApi.list(),
  });

  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (name: string) => sheetsApi.create({ name }),
    onSuccess: (newSheet: Sheet) => {
      queryClient.invalidateQueries({ queryKey: ["sheets"] });
      setCurrentSheet(newSheet.name);
      setAdding(false);
      setDraftName("");
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Stale-sheet recovery: if the selected sheet is no longer in the list,
  // fall back to the first available sheet (or DEFAULT_SHEET).
  useEffect(() => {
    if (isLoading || sheets.length === 0) return;
    if (!sheets.some((s) => s.name === currentSheet)) {
      setCurrentSheet(sheets[0]?.name ?? DEFAULT_SHEET);
    }
  }, [sheets, currentSheet, setCurrentSheet, isLoading]);

  const commit = () => {
    if (createMutation.isPending) return;
    const trimmed = draftName.trim();
    if (trimmed.length === 0) {
      setAdding(false);
      setDraftName("");
      setError(null);
      return;
    }
    if (!SHEET_NAME_REGEX.test(trimmed)) {
      setError(SHEET_NAME_HINT);
      return;
    }
    createMutation.mutate(trimmed);
  };

  const cancel = () => {
    setAdding(false);
    setDraftName("");
    setError(null);
  };

  return (
    <div className="flex gap-0.5 bg-surface border-t border-border px-2 py-1 text-xs items-center">
      {isLoading ? (
        <span className="px-3 py-1 text-text-muted">Loading sheets…</span>
      ) : (
        sheets.map((sheet) => (
          <button
            key={sheet.id}
            type="button"
            onClick={() => setCurrentSheet(sheet.name)}
            className={
              sheet.name === currentSheet
                ? ACTIVE_TAB_CLASS
                : INACTIVE_TAB_CLASS
            }
          >
            {sheet.name}
          </button>
        ))
      )}
      {!isLoading && !isError && (
        adding ? (
          <input
            autoFocus
            value={draftName}
            onChange={(e) => {
              setDraftName(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            onBlur={commit}
            placeholder="sheet name"
            aria-label="New sheet name"
            className="bg-base border border-border rounded-t-md px-2 py-1 text-xs w-28 outline-none focus:ring-1 focus:ring-accent"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="px-2 py-1 text-text-muted hover:text-text transition-colors"
            aria-label="Add sheet"
          >
            +
          </button>
        )
      )}
      {isError && (
        <span className="ml-2 text-red-500">failed to load tabs</span>
      )}
      {error && <span className="ml-2 text-red-500">{error}</span>}
    </div>
  );
}
