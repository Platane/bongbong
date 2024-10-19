import type { R2Bucket, PagesFunction } from "@cloudflare/workers-types";
import out from "../../webRTC-signal";

/**
 * it would be nice to have the signal api on the same origin to avoid pre flight request
 * it should be possible with page functions
 */

export const onRequest: PagesFunction<{ bucket: R2Bucket }> = ({
  request,
  env,
}) => {
  // we need to strip the /signal prefix
  //

  const u = new URL(request.url);
  u.pathname = u.pathname.split("/signal")[1];

  // pretty hacky way to change the request url
  const requestWithDifferentUrl = new Proxy(request, {
    get(target, prop) {
      if (prop === "url") return u.toString();
      if (prop === "json") return () => target.json();
      return (target as any)[prop];
    },
  });

  return out.fetch(requestWithDifferentUrl as any, env);
};
