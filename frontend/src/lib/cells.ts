import type {
  Cell,
  CellCreateInput,
  CellUpdateInput,
  CellReorderInput,
} from "@cellsite/shared";
import { api } from "./api.js";

export const cellsApi = {
  list: (sheet = "creative") =>
    api.get<Cell[]>(`/cells?sheet=${encodeURIComponent(sheet)}`),
  create: (input: CellCreateInput) => api.post<Cell>("/cells", input),
  update: (id: string, input: CellUpdateInput) =>
    api.patch<Cell>(`/cells/${id}`, input),
  delete: (id: string) => api.delete<void>(`/cells/${id}`),
  reorder: (updates: CellReorderInput[]) =>
    api.post<{ status: string }>("/cells/reorder", { updates }),
};
