const blobs = new Map<string, Uint8Array>();

const corsMiddleware =
  (f: (req: Request) => Response | Promise<Response>) =>
  async (req: Request) => {
    const res = await f(req);
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
    return res;
  };

Bun.serve({
  fetch: corsMiddleware(async (req) => {
    const url = new URL(req.url);

    console.log(url.pathname, req.method);

    const [, key] = url.pathname.match(/^\/blob\/(\w*)\/?$/) ?? [];

    if (key && req.method === "GET") {
      const value = blobs.get(key);

      if (value) return new Response(value);

      return new Response("no value for this key", {
        status: 404,
      });
    }

    if (key && req.method === "PUT") {
      if (blobs.has(key))
        return new Response("a value for this key already exists", {
          status: 409,
        });

      const body = (await req.body?.getReader().read())?.value;

      if (body) {
        blobs.set(key, body);
        return new Response();
      }

      return new Response("missing body", { status: 400 });
    }

    if (key && req.method === "OPTIONS") return new Response("");

    return new Response("unknown route", { status: 404 });
  }),

  port: 3000,
});
