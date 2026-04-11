import type { Sheet, SheetCreateInput } from "@cellsite/shared";
import { api } from "./api.js";

export const sheetsApi = {
  list: () => api.get<Sheet[]>("/sheets"),
  create: (input: SheetCreateInput) => api.post<Sheet>("/sheets", input),
};
