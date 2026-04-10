import Fastify from "fastify";
import { env } from "./env.js";

export async function buildServer() {
  const fastify = Fastify({
    logger: env.NODE_ENV !== "test",
  });

  fastify.get("/api/health", async () => {
    return { status: "ok" };
  });

  return fastify;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await buildServer();
  try {
    await server.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`Server listening on port ${env.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
