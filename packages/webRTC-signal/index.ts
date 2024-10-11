import type {
  KVNamespace,
  R2Bucket,
  ExportedHandler,
} from "@cloudflare/workers-types";

const cors =
  <A extends Array<any>>(f: (...args: A) => Response | Promise<Response>) =>
  async (...args: A) => {
    const res = await f(...args);
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return res;
  };

export default {
  fetch: cors(async (req, { kv, bucket }) => {
    const url = new URL(req.url);

    const [, key] = url.pathname.match(/^\/room\/(\w*)\/?$/) ?? [];

    if (key && req.method === "GET") {
      const value = await bucket.get(key);

      if (value)
        return new Response(await value.arrayBuffer(), {
          headers: { "Content-Type": "application/json" },
        });

      return new Response("no value for this key", { status: 404 });
    }

    if (key && req.method === "PUT") {
      const body = await req.json();

      const value = await bucket.get(key);

      const list = value ? ((await value.json()) as any[]) : [];
      list.push(body);

      const result = await bucket.put(
        key,
        JSON.stringify(list),
        value ? { onlyIf: { etagMatches: value.etag } } : {}
      );

      if (result === null)
        return new Response("concurrent write", { status: 409 });

      return new Response("ok");
    }

    if (key && req.method === "OPTIONS") return new Response();

    return new Response("unknown route", { status: 404 });
  }),
} satisfies ExportedHandler<{
  kv: KVNamespace;
  bucket: R2Bucket;
}>;
