import { serve } from "@hono/node-server";
import app from "./app";

const port = Number(process.env.PORT) || 3000;
const hostname = "0.0.0.0";

console.log(`[lunar] starting on ${hostname}:${port}`);
console.log(`[lunar] NODE_ENV=${process.env.NODE_ENV || "undefined"}`);

serve({
  fetch: app.fetch,
  port,
  hostname,
});
