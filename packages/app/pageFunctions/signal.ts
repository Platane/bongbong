import type { R2Bucket, PagesFunction } from "@cloudflare/workers-types";
import out from "../../webRTC-signal";

export const onRequest: PagesFunction<{ bucket: R2Bucket }> = ({
  request,
  env,
}) => {
  console.log("coucou");

  const u = new URL(request.url);
  u.pathname = "/api" + u.pathname;
  request.url = u.toString();

  console.log(u, request.url);

  return out.fetch(request, env);
};
