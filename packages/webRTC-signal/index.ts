import type { R2Bucket, ExportedHandler } from "@cloudflare/workers-types";

/*
 * middleware to append access control related headers to the response
 */
const cors =
  <A extends Array<any>>(
    f: (req: Request, ...args: A) => Response | Promise<Response>
  ) =>
  async (req: Request, ...args: A) => {
    const res = await f(req, ...args);

    const origin = req.headers.get("origin");

    if (origin) {
      const { host, hostname } = new URL(origin);

      if (
        hostname === "localhost" ||
        host === "platane.github.io" ||
        host === "platane.me" ||
        host.endsWith(".platane.me")
      )
        res.headers.set("Access-Control-Allow-Origin", origin);
    }

    res.headers.set("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, If-Modified-Since"
    );
    return res;
  };

export default {
  fetch: cors(async (req, { bucket }) => {
    const url = new URL(req.url);

    const [, key] = url.pathname.match(/^\/room\/(\w*)\/?$/) ?? [];

    if (key && req.method === "GET") {
      const value = await bucket.get(key);

      if (value) {
        // exception for the header If-Modified-Since
        {
          const ifModifierSince = req.headers.get("If-Modified-Since");

          if (
            ifModifierSince &&
            new Date(value.uploaded.toUTCString()).getTime() <=
              new Date(ifModifierSince).getTime()
          )
            return new Response("", {
              status: 304,
              headers: { "Last-Modified": value.uploaded.toUTCString() },
            });
        }

        return new Response(await value.arrayBuffer(), {
          headers: {
            "Content-Type": "application/json",
            "Last-Modified": value.uploaded.toUTCString(),
          },
        });
      }

      return new Response("no value for this key", { status: 404 });
    }

    if (key && req.method === "PUT") {
      const body = await req.json();

      const RETRY_COUNT = 4;
      for (let k = RETRY_COUNT; k--; ) {
        const value = await bucket.get(key);

        const list = value ? ((await value.json()) as unknown[]) : [];
        list.push(body);

        const result = await bucket.put(
          key,
          JSON.stringify(list),
          value ? { onlyIf: { etagMatches: value.etag } } : {}
        );

        if (result) return new Response("ok");
      }

      return new Response("concurrent write", { status: 409 });
    }

    if (key && req.method === "OPTIONS") return new Response();

    return new Response("unknown route", { status: 404 });
  }),
} satisfies ExportedHandler<{
  bucket: R2Bucket;
}>;
