import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../server.js";
import { db, closeDb } from "../db/client.js";
import { sheets } from "../db/schema.js";

describe("sheets routes", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildServer();
    await db.delete(sheets);
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("GET /api/sheets returns an empty array when no sheets exist", async () => {
    const response = await app.inject({ method: "GET", url: "/api/sheets" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it("POST /api/sheets creates a new sheet at the next position", async () => {
    const first = await app.inject({
      method: "POST",
      url: "/api/sheets",
      payload: { name: "creative" },
    });
    expect(first.statusCode).toBe(201);
    expect(first.json().name).toBe("creative");
    expect(first.json().position).toBe(0);

    const second = await app.inject({
      method: "POST",
      url: "/api/sheets",
      payload: { name: "writing" },
    });
    expect(second.statusCode).toBe(201);
    expect(second.json().position).toBe(1);
  });

  it("POST /api/sheets rejects duplicate names with 409", async () => {
    await app.inject({
      method: "POST",
      url: "/api/sheets",
      payload: { name: "creative" },
    });
    const response = await app.inject({
      method: "POST",
      url: "/api/sheets",
      payload: { name: "creative" },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json().error).toBe(
      "A sheet with that name already exists",
    );
  });

  it("POST /api/sheets rejects invalid names with 400 and a string error", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/sheets",
      payload: { name: "bad/name!" },
    });
    expect(response.statusCode).toBe(400);
    expect(typeof response.json().error).toBe("string");
  });

  it("GET /api/sheets orders by position ascending", async () => {
    await app.inject({
      method: "POST",
      url: "/api/sheets",
      payload: { name: "alpha" },
    });
    await app.inject({
      method: "POST",
      url: "/api/sheets",
      payload: { name: "beta" },
    });
    await app.inject({
      method: "POST",
      url: "/api/sheets",
      payload: { name: "gamma" },
    });

    const response = await app.inject({ method: "GET", url: "/api/sheets" });
    const body = response.json();
    expect(body).toHaveLength(3);
    expect(body.map((s: { name: string }) => s.name)).toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
    expect(body.map((s: { position: number }) => s.position)).toEqual([
      0, 1, 2,
    ]);
  });
});
