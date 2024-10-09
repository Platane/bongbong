import { cors, handler } from "./handler";

const blobs = new Map<string, Uint8Array | string>();

Bun.serve({
  fetch: cors(
    handler({
      get: async (key) => blobs.get(key) ?? null,
      put: async (key, value) => void blobs.set(key, value),
    })
  ),

  port: 3000,
});
