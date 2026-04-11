import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { registerCellRoutes } from "./routes/cells.js";
import { registerSheetRoutes } from "./routes/sheets.js";
import { registerStaticFrontend } from "./static.js";

export async function buildServer() {
  const fastify = Fastify({
    logger: env.NODE_ENV !== "test",
  });

  if (env.NODE_ENV === "development") {
    await fastify.register(cors, {
      origin: "http://localhost:5173",
      credentials: true,
    });
  }

  fastify.get("/api/health", async () => {
    return { status: "ok" };
  });

  await registerCellRoutes(fastify);
  await registerSheetRoutes(fastify);

  if (env.NODE_ENV === "production") {
    await registerStaticFrontend(fastify);
  }

  return fastify;
}

if (import.meta.filename === process.argv[1]) {
  const server = await buildServer();
  try {
    await server.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`Server listening on port ${env.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
