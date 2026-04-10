export type CellType =
  | "blog"
  | "gallery"
  | "document"
  | "presentation"
  | "audio"
  | "external";

export interface Cell {
  id: string;
  sheet: string;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  type: CellType;
  title: string;
  subtitleJa: string | null;
  icon: string;
  targetId: string | null;
  targetTable: string | null;
  externalUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CellCreateInput {
  sheet?: string;
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
  type: CellType;
  title: string;
  subtitleJa?: string | null;
  icon: string;
  targetId?: string | null;
  targetTable?: string | null;
  externalUrl?: string | null;
}

export type CellUpdateInput = Partial<Omit<CellCreateInput, "sheet">>;

export interface CellReorderInput {
  id: string;
  row: number;
  col: number;
}

export const CELL_TYPES: readonly CellType[] = [
  "blog",
  "gallery",
  "document",
  "presentation",
  "audio",
  "external",
] as const;

export const DEFAULT_SHEET = "creative";
export const DEFAULT_GRID_COLS = 10;
export const DEFAULT_GRID_ROWS = 20;
