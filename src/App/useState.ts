import * as React from "react";
import { createClient } from "@liveblocks/client";

export type State<Game = any> =
  | { type: "404"; pathname: string }
  | { type: "home" }
  | {
      type: "lobby";
      roomId: string;
      connectedRemotes: { id: string; hand: "right" | "left" }[];
      remoteId: null | string;
    }
  | {
      type: "game";
      roomId: string;
      game: Game;
    };

export type Action =
  | {
      type: "read-initial-url";
      pathname: string;
      search: string;
      hash: string;
    }
  | {
      type: "navigate";
      pathname: string;
      search: string;
      hash: string;
    }| { type:'create-room'}

export const reduceRoute = (state: State, action: Action): State => {
  switch (action.type) {
    case "navigate":
    case "read-initial-url": {
      let m;

      if ((m = action.pathname.match(/^\/room\/(\w+)\/remote\/(\w+)/))) {
        return {
          type: "lobby",
          roomId: m[1],
          remoteId: m[2],
          connectedRemotes: state.connectedRemotes ?? [],
        } as const;
      }

      if ((m = action.pathname.match(/^\/room\/(\w+)\/remote\/join/))) {
        const remoteId = Math.random().toString(36).slice(2);
        return {
          type: "lobby",
          roomId: m[1],
          remoteId: remoteId,
          connectedRemotes: state.connectedRemotes ?? [],
        } as const;
      }

      if ((m = action.pathname.match(/^\/room\/(\w+)/))) {
        return {
          type: "lobby",
          roomId: m[1],
          remoteId: null,
          connectedRemotes: state.connectedRemotes ?? [],
        } as const;
      }

      if (action.pathname === "/") return { type: "home" } as const;

      return { ...action, type: "404" } as const;
    }
    default:
      return state;
  }
};

export const reduce = (
  state: State = { type: "home" },
  action: Action
): State => {
  let nextState = reduceRoute(state, action);

  return nextState;
};

const BASE_URL = import.meta.env.BASE_URL;
const LIVEBLOCKS_API_KEY =
  "pk_dev_zC81tVVIuXr9D1AHq0fwfhZON1PCYj4UjXi9f6buP9ddTErRWvPrDwyJzB3TEQDJ";

const getCurrentUrl = () => {
  const url = window.location.href;

  const { pathname, search, hash } = new URL(url, "http://example.com");

  let [, r] = ("start_of_url_token" + pathname).split(
    "start_of_url_token" + BASE_URL
  );

  if (r[0] !== "/") r = "/" + r;

  return { pathname: r, search, hash };
};

const selectCurrentUrl = (state: State) => {
  switch (state.type) {
    case "home":
      return "/";
    case "game":
    case "lobby": {
      if (state.remoteId)
        return `room/${state.roomId}/remote/${state.remoteId}`;
      return `room/${state.roomId}`;
    }
  }
};

export const useState = () => {
  const liveBlocksClient = React.useMemo(
    () => createClient({ publicApiKey: LIVEBLOCKS_API_KEY }),
    []
  );

  React.useEffect(() => liveBlocksClient.logout(), []);

  const [state, dispatch] = React.useReducer(reduce, undefined, () =>
    reduce(undefined, {
      type: "read-initial-url",
      ...getCurrentUrl(),
    })
  );

  // connect to liveblocks

  const roomId = state.roomId;
  React.useEffect(() => {
    const { room, leave } = liveBlocksClient.enterRoom(roomId);

    const unsubscribe = room.subscribe("event", ({ event }) => {
      dispatch(event);
    });

    return () => {
      unsubscribe();
      leave();
    };
  }, [roomId]);

  // change url

  const previousState = usePreviousValue(state);
  React.useEffect(() => {
    const replace = previousState === state;

    const url = selectCurrentUrl(state);

    if (replace) history.replaceState(history.state, "", url);
    else history.pushState(history.state, "", url);
  }, [state.type]);

const createRoom = () => 

  return { ...state };
};

const usePreviousValue = <V>(v: V) => {
  const previous = React.useRef({ previous: v, current: v });
  if (previous.current.current !== v) {
    previous.current.previous = previous.current.current;
    previous.current.current = v;
  }
  return previous.current.previous;
};
