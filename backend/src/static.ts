import type { FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function registerStaticFrontend(app: FastifyInstance) {
  const frontendDist = resolve(__dirname, "../../frontend/dist");

  if (!existsSync(frontendDist)) {
    app.log.warn(
      `Frontend dist not found at ${frontendDist} — skipping static file registration. Run the frontend build first.`,
    );
    return;
  }

  await app.register(fastifyStatic, {
    root: frontendDist,
    prefix: "/",
    wildcard: false,
  });

  // SPA fallback: any non-API route should return index.html
  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith("/api/")) {
      return reply.code(404).send({ error: "Not found" });
    }
    return reply.sendFile("index.html", frontendDist);
  });
}
