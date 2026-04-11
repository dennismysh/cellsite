import type { FastifyInstance } from "fastify";
import { asc, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { sheets } from "../db/schema.js";

const SHEET_NAME_REGEX = /^[\w\- ]+$/;
const SHEET_NAME_ERROR =
  "Sheet name must be 1-40 chars, letters/numbers/spaces/_/- only";

const createSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(SHEET_NAME_REGEX),
});

function serializeSheet(row: typeof sheets.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function registerSheetRoutes(app: FastifyInstance) {
  app.get("/api/sheets", async () => {
    const rows = await db
      .select()
      .from(sheets)
      .orderBy(asc(sheets.position), asc(sheets.createdAt));
    return rows.map(serializeSheet);
  });

  app.post("/api/sheets", async (request, reply) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: SHEET_NAME_ERROR });
    }
    try {
      const created = await db.transaction(async (tx) => {
        const [{ nextPosition }] = await tx
          .select({
            nextPosition: sql<number>`COALESCE(MAX(${sheets.position}), -1) + 1`,
          })
          .from(sheets);
        const [row] = await tx
          .insert(sheets)
          .values({
            name: parsed.data.name,
            position: Number(nextPosition),
          })
          .returning();
        return row;
      });
      return reply.code(201).send(serializeSheet(created));
    } catch (err) {
      if (err instanceof Error && err.message.includes("duplicate")) {
        return reply
          .code(409)
          .send({ error: "A sheet with that name already exists" });
      }
      throw err;
    }
  });
}
