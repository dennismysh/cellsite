import { sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const cells = pgTable(
  "cells",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sheet: text("sheet").notNull().default("creative"),
    row: integer("row").notNull(),
    col: integer("col").notNull(),
    rowSpan: integer("row_span").notNull().default(1),
    colSpan: integer("col_span").notNull().default(1),
    type: text("type").notNull(),
    title: text("title").notNull(),
    subtitleJa: text("subtitle_ja"),
    icon: text("icon").notNull(),
    targetId: uuid("target_id"),
    targetTable: text("target_table"),
    externalUrl: text("external_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    sheetPositionUnique: uniqueIndex("cells_sheet_row_col_unique").on(
      table.sheet,
      table.row,
      table.col,
    ),
  }),
);

export type DbCell = typeof cells.$inferSelect;
export type DbCellInsert = typeof cells.$inferInsert;

export const sheets = pgTable(
  "sheets",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    nameUnique: uniqueIndex("sheets_name_unique").on(table.name),
  }),
);

export type DbSheet = typeof sheets.$inferSelect;
export type DbSheetInsert = typeof sheets.$inferInsert;
