import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { cells } from "../db/schema.js";
import { CELL_TYPES, DEFAULT_SHEET } from "@cellsite/shared";

const cellTypeSchema = z.enum(CELL_TYPES as unknown as [string, ...string[]]);

const createSchema = z.object({
  sheet: z.string().default(DEFAULT_SHEET),
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  rowSpan: z.number().int().min(1).default(1),
  colSpan: z.number().int().min(1).default(1),
  type: cellTypeSchema,
  title: z.string().min(1),
  subtitleJa: z.string().nullable().optional(),
  icon: z.string().min(1),
  targetId: z.string().uuid().nullable().optional(),
  targetTable: z.string().nullable().optional(),
  externalUrl: z.string().url().nullable().optional(),
});

const updateSchema = createSchema.partial().omit({ sheet: true });

const reorderSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().uuid(),
        row: z.number().int().min(0),
        col: z.number().int().min(0),
      }),
    )
    .min(1),
});

function serializeCell(row: typeof cells.$inferSelect) {
  return {
    id: row.id,
    sheet: row.sheet,
    row: row.row,
    col: row.col,
    rowSpan: row.rowSpan,
    colSpan: row.colSpan,
    type: row.type,
    title: row.title,
    subtitleJa: row.subtitleJa,
    icon: row.icon,
    targetId: row.targetId,
    targetTable: row.targetTable,
    externalUrl: row.externalUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function registerCellRoutes(app: FastifyInstance) {
  app.get("/api/cells", async (request) => {
    const sheet =
      typeof request.query === "object" &&
      request.query &&
      "sheet" in request.query
        ? String((request.query as { sheet?: string }).sheet ?? DEFAULT_SHEET)
        : DEFAULT_SHEET;
    const rows = await db.select().from(cells).where(eq(cells.sheet, sheet));
    return rows.map(serializeCell);
  });

  app.post("/api/cells", async (request, reply) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    try {
      const [created] = await db
        .insert(cells)
        .values({
          sheet: parsed.data.sheet,
          row: parsed.data.row,
          col: parsed.data.col,
          rowSpan: parsed.data.rowSpan,
          colSpan: parsed.data.colSpan,
          type: parsed.data.type,
          title: parsed.data.title,
          subtitleJa: parsed.data.subtitleJa ?? null,
          icon: parsed.data.icon,
          targetId: parsed.data.targetId ?? null,
          targetTable: parsed.data.targetTable ?? null,
          externalUrl: parsed.data.externalUrl ?? null,
        })
        .returning();
      return reply.code(201).send(serializeCell(created));
    } catch (err) {
      if (err instanceof Error && err.message.includes("duplicate")) {
        return reply
          .code(409)
          .send({ error: "A cell already exists at that position" });
      }
      throw err;
    }
  });

  app.patch("/api/cells/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const [updated] = await db
      .update(cells)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(cells.id, id))
      .returning();
    if (!updated) {
      return reply.code(404).send({ error: "Cell not found" });
    }
    return serializeCell(updated);
  });

  app.delete("/api/cells/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await db.delete(cells).where(eq(cells.id, id)).returning();
    if (deleted.length === 0) {
      return reply.code(404).send({ error: "Cell not found" });
    }
    return reply.code(204).send();
  });

  app.post("/api/cells/reorder", async (request, reply) => {
    const parsed = reorderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    await db.transaction(async (tx) => {
      for (const update of parsed.data.updates) {
        await tx
          .update(cells)
          .set({
            row: update.row,
            col: update.col,
            updatedAt: new Date(),
          })
          .where(eq(cells.id, update.id));
      }
    });
    return { status: "ok" };
  });
}
