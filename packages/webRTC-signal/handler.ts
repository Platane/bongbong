export type Store = {
  get: (key: string) => Promise<string | Uint8Array | null>;
  put: (key: string, value: string | Uint8Array) => Promise<void>;
};

export const handler = (store: Store) => async (req: Request) => {
  const url = new URL(req.url);

  const [, key] = url.pathname.match(/^\/blob\/(\w*)\/?$/) ?? [];

  if (key && req.method === "GET") {
    const value = await store.get(key);

    if (value) return new Response(value);

    return new Response("no value for this key", { status: 404 });
  }

  if (key && req.method === "PUT") {
    if (await store.get(key))
      return new Response("a value for this key already exists", {
        status: 409,
      });

    const body = new Uint8Array(await req.arrayBuffer());

    if (body) {
      await store.put(key, body);
      return new Response("ok");
    }

    return new Response("missing body", { status: 400 });
  }

  if (key && req.method === "OPTIONS") return new Response("");

  return new Response("unknown route", { status: 404 });
};

export const cors =
  <R>(f: (req: R) => Response | Promise<Response>) =>
  async (req: R) => {
    const res = await f(req);
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
    return res;
  };
