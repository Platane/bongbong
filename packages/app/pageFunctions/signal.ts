import type { R2Bucket, PagesFunction } from "@cloudflare/workers-types";
import out from "../../webRTC-signal";

export const onRequest: PagesFunction<{ bucket: R2Bucket }> = ({
  request,
  env,
}) => {
  const u = new URL(request.url);
  u.pathname = u.pathname.split("/signal")[1];

  // pretty hacky way to change the request url
  const requestWithDifferentUrl = new Proxy(request, {
    get(target, prop, receiver) {
      if (prop === "url") return u.toString();
      if (prop === "json") return () => target.json();

      return Reflect.get(target, prop, receiver);
      return (target as any)[prop];
    },
  });

  return out.fetch(requestWithDifferentUrl as any, env);
};
