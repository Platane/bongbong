import type { R2Bucket, PagesFunction } from "@cloudflare/workers-types";
import out from "../../webRTC-signal";

export const onRequest: PagesFunction<{ bucket: R2Bucket }> = ({
  request,
  env,
}) => {
  const u = new URL(request.url);
  u.pathname = "/api" + u.pathname;
  request.url = u.toString();
  return out.fetch(request, env);
};
