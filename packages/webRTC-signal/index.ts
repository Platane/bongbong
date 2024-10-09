import { cors, handler } from "./handler";

import type { KVNamespace, ExportedHandler } from "@cloudflare/workers-types";

export default {
  async fetch(request, env, ctx) {
    return cors(
      handler({
        get: async (key) => await env.kv.get(key),
        put: async (key, value) =>
          void env.kv.put(key, value, { expirationTtl: 60 * 20 }),
      })
    )(request);
  },
} satisfies ExportedHandler<{
  kv: KVNamespace;
}>;
