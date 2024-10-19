import type { R2Bucket, PagesFunction } from "@cloudflare/workers-types";
import out from "../../webRTC-signal";

export const onRequest: PagesFunction<{ bucket: R2Bucket }> = ({
  request,
  env,
}) => {
  console.log("coucou");

  const u = new URL(request.url);
  u.pathname = u.pathname.split("/signal")[1];

  const redirect = new Request(u.toString(), request as Request);

  // use a stub instead

  console.log(u, redirect.url);

  const r = new Proxy(request, {
    get(target, prop, receiver) {
      if (prop === "url") return u.toString();
      return Reflect.get(target, prop, receiver);
    },
  });

  return out.fetch(r as any, env);
};
