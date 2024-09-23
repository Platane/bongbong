// @ts-ignore
const BASE_URL = import.meta.env.BASE_URL;

export const parseRoute = (url: string) => {
  const { pathname } = new URL(url, "http://example.com");

  const [, r] = ("start_of_url_token" + pathname).split(
    "start_of_url_token" + BASE_URL
  );

  let m: any[] | null;

  if ((m = r.match(/^room\/(\w+)\/remote\/join/))) {
    return { name: "new-remote", roomId: m[1] } as const;
  }

  if ((m = r.match(/^room\/(\w+)\/remote\/(\w+)/))) {
    return { name: "remote", roomId: m[1], remoteId: m[2] } as const;
  }

  if ((m = r.match(/^room\/(\w+)/))) {
    return { name: "lobby", roomId: m[1] } as const;
  }

  if (r === "") return { name: "home" } as const;

  return {
    name: "404",
    pathname,
    search: "" as string,
    hash: "" as string,
  } as const;
};

export type Route = ReturnType<typeof parseRoute>;

export const buildRoute = (route: Route) => {
  const r = (() => {
    switch (route.name) {
      case "home":
        return "";
      case "new-remote":
        return `room/${route.roomId}/remote/join`;
      case "lobby":
        return `room/${route.roomId}`;
      case "remote":
        return `room/${route.roomId}/remote/${route.remoteId}`;
      case "404":
        return route.pathname;
    }
  })();

  return BASE_URL + r;
};
