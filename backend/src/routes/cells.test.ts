import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../server.js";
import { db, closeDb } from "../db/client.js";
import { cells } from "../db/schema.js";

describe("cells routes", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildServer();
    await db.delete(cells);
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("GET /api/cells returns an empty array when no cells exist", async () => {
    const response = await app.inject({ method: "GET", url: "/api/cells" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it("POST /api/cells creates a new cell and returns it", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/cells",
      payload: {
        row: 0,
        col: 0,
        type: "external",
        title: "GitHub",
        subtitleJa: "コード",
        icon: "🐙",
        externalUrl: "https://github.com/example",
      },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.id).toBeDefined();
    expect(body.title).toBe("GitHub");
    expect(body.externalUrl).toBe("https://github.com/example");
    expect(body.rowSpan).toBe(1);
    expect(body.colSpan).toBe(1);
    expect(body.sheet).toBe("creative");
  });

  it("POST /api/cells rejects duplicate (sheet, row, col)", async () => {
    await app.inject({
      method: "POST",
      url: "/api/cells",
      payload: {
        row: 0,
        col: 0,
        type: "external",
        title: "A",
        icon: "🐙",
        externalUrl: "https://a.example",
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/api/cells",
      payload: {
        row: 0,
        col: 0,
        type: "external",
        title: "B",
        icon: "🦊",
        externalUrl: "https://b.example",
      },
    });
    expect(response.statusCode).toBe(409);
  });

  it("GET /api/cells lists existing cells", async () => {
    await db.insert(cells).values({
      sheet: "creative",
      row: 1,
      col: 2,
      type: "external",
      title: "Existing",
      icon: "⭐",
      externalUrl: "https://example.com",
    });
    const response = await app.inject({ method: "GET", url: "/api/cells" });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe("Existing");
  });

  it("PATCH /api/cells/:id updates fields", async () => {
    const [created] = await db
      .insert(cells)
      .values({
        sheet: "creative",
        row: 0,
        col: 0,
        type: "external",
        title: "Old",
        icon: "⭐",
        externalUrl: "https://old.example",
      })
      .returning();

    const response = await app.inject({
      method: "PATCH",
      url: `/api/cells/${created.id}`,
      payload: { title: "New", externalUrl: "https://new.example" },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.title).toBe("New");
    expect(body.externalUrl).toBe("https://new.example");
  });

  it("DELETE /api/cells/:id removes the cell", async () => {
    const [created] = await db
      .insert(cells)
      .values({
        sheet: "creative",
        row: 0,
        col: 0,
        type: "external",
        title: "Doomed",
        icon: "💀",
        externalUrl: "https://rip.example",
      })
      .returning();

    const response = await app.inject({
      method: "DELETE",
      url: `/api/cells/${created.id}`,
    });
    expect(response.statusCode).toBe(204);

    const list = await app.inject({ method: "GET", url: "/api/cells" });
    expect(list.json()).toEqual([]);
  });

  it("GET /api/cells?sheet=X isolates cells by sheet", async () => {
    await app.inject({
      method: "POST",
      url: "/api/cells",
      payload: {
        sheet: "writing",
        row: 0,
        col: 0,
        type: "external",
        title: "W1",
        icon: "✍️",
        externalUrl: "https://w.example",
      },
    });
    await app.inject({
      method: "POST",
      url: "/api/cells",
      payload: {
        sheet: "creative",
        row: 0,
        col: 0,
        type: "external",
        title: "C1",
        icon: "🎨",
        externalUrl: "https://c.example",
      },
    });

    const writing = await app.inject({
      method: "GET",
      url: "/api/cells?sheet=writing",
    });
    expect(writing.statusCode).toBe(200);
    const writingBody = writing.json();
    expect(writingBody).toHaveLength(1);
    expect(writingBody[0].title).toBe("W1");
    expect(writingBody[0].sheet).toBe("writing");

    const creative = await app.inject({
      method: "GET",
      url: "/api/cells?sheet=creative",
    });
    const creativeBody = creative.json();
    expect(creativeBody).toHaveLength(1);
    expect(creativeBody[0].title).toBe("C1");
  });

  it("POST /api/cells/reorder updates positions atomically", async () => {
    const [a] = await db
      .insert(cells)
      .values({
        sheet: "creative",
        row: 0,
        col: 0,
        type: "external",
        title: "A",
        icon: "🅰️",
        externalUrl: "https://a.example",
      })
      .returning();
    const [b] = await db
      .insert(cells)
      .values({
        sheet: "creative",
        row: 1,
        col: 0,
        type: "external",
        title: "B",
        icon: "🅱️",
        externalUrl: "https://b.example",
      })
      .returning();

    const response = await app.inject({
      method: "POST",
      url: "/api/cells/reorder",
      payload: {
        updates: [
          { id: a.id, row: 5, col: 5 },
          { id: b.id, row: 6, col: 5 },
        ],
      },
    });
    expect(response.statusCode).toBe(200);
    const list = await app.inject({ method: "GET", url: "/api/cells" });
    const items = list.json();
    const reorderedA = items.find((c: { id: string }) => c.id === a.id);
    expect(reorderedA.row).toBe(5);
    expect(reorderedA.col).toBe(5);
  });
});
