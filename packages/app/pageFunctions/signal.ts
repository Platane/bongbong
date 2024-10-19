import type { R2Bucket, PagesFunction } from "@cloudflare/workers-types";
import out from "../../webRTC-signal";

export const onRequest: PagesFunction<{ bucket: R2Bucket }> = ({
  request,
  env,
}) => {
  console.log("coucou");

  const u = new URL(request.url);
  u.pathname = u.pathname.split("/signal")[1];

  const redirect = new Request(u.toString(), request);

  console.log(u, redirect.url);

  return out.fetch(redirect, env);
};
