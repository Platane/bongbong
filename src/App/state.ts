import { Room, createClient } from "@liveblocks/client";
import deepEqual from "fast-deep-equal";
import { buildRoute, parseRoute } from "./routes";

export type State<Game = any> =
  | { type: "404"; pathname: string; search: string; hash: string }
  | { type: "home" }
  | {
      type: "lobby";
      roomId: string;
      connectedRemotes: { remoteId: string; hand: "right" | "left" }[];
    }
  | {
      type: "remote";
      roomId: string;
      remoteId: string;
      hand: "right" | "left";
      connectedRemotes: { remoteId: string; hand: "right" | "left" }[];
    }
  | {
      type: "game";
      roomId: string;
      game: Game;
      connectedRemotes: { remoteId: string; hand: "right" | "left" }[];
    };

const LIVEBLOCKS_API_KEY =
  "pk_dev_zC81tVVIuXr9D1AHq0fwfhZON1PCYj4UjXi9f6buP9ddTErRWvPrDwyJzB3TEQDJ";

const createSubscribable = () => {
  const listeners = new Set<() => void>();

  const broadcast = () => {
    for (const l of listeners) l();
  };
  const subscribe = (h: () => void) => {
    listeners.add(h);
    return () => {
      listeners.delete(h);
    };
  };
  const dispose = () => listeners.clear();

  return { broadcast, subscribe, dispose };
};

const createSubscribeToChange = <State>(
  getState: () => State,
  subscribe: (h: () => void) => () => void,
) => {
  const cleanUps = new Set<(() => void) | undefined>();
  const subscribeToChange = <S>(
    selector: (state: State) => S,
    handler: (s: S) => void | (() => void),
    {
      equalsFn = (a, b) => a === b,
      initialTrigger = true,
    }: { equalsFn?: (a: S, b: S) => boolean; initialTrigger?: boolean } = {},
  ) => {
    let previousValue = selector(getState());

    let cleanUp: undefined | (() => void);
    if (initialTrigger) cleanUp = handler(previousValue) || undefined;
    cleanUps.add(cleanUp);

    const unsubscribe = subscribe(() => {
      const value = selector(getState());
      if (!equalsFn(previousValue, value)) {
        cleanUp?.();
        cleanUps.delete(cleanUp);
        cleanUp = handler(previousValue) || undefined;
        cleanUps.add(cleanUp);
      }
    });

    cleanUps.add(unsubscribe);

    return unsubscribe;
  };
  const dispose = () => {
    for (const l of cleanUps) l?.();
    cleanUps.clear();
  };

  return { dispose, subscribeToChange };
};

export const createState = () => {
  let state = { type: "home" } as State;
  const getState = () => state;

  const {
    subscribe,
    broadcast,
    dispose: disposeSubscribable,
  } = createSubscribable();

  const setState = (s: State) => {
    state = s;
    broadcast();
  };

  const { subscribeToChange, dispose: disposeSubscribeToChange } =
    createSubscribeToChange(getState, subscribe);

  const liveBlocksClient = createClient({ publicApiKey: LIVEBLOCKS_API_KEY });

  // check initial route
  {
    const route = parseRoute(window.location.href);
    if (route.name === "new-remote") {
      const remoteId = generateRandomId();
      setState({
        type: "remote",
        remoteId,
        hand: "left",
        roomId: route.roomId,
        connectedRemotes: [],
      });
    }

    if (route.name === "remote") {
      setState({
        type: "remote",
        hand: "left",
        remoteId: route.remoteId,
        roomId: route.roomId,
        connectedRemotes: [],
      });
    }

    if (route.name === "lobby") {
      setState({
        type: "lobby",
        roomId: route.roomId,
        connectedRemotes: [],
      });
    }
  }

  // handle location
  subscribeToChange(
    (state) => {
      switch (state.type) {
        case "lobby":
        case "game":
          return buildRoute({ ...state, name: "lobby" });
        case "remote":
          return buildRoute({ ...state, name: "remote" });
        case "home":
          return buildRoute({ name: "home" });
        case "404":
          return buildRoute({ ...state, name: "404" });
      }
    },
    (url) => {
      history.replaceState(history.state, "", url);
    },
  );

  // handle live messaging
  let room: undefined | Room;
  {
    // enter room
    subscribeToChange(
      (state) =>
        state.type === "lobby" || state.type === "remote" ? state.roomId : null,

      (roomId) => {
        if (room?.id === roomId || !roomId) return;

        const { leave, room: room_ } = liveBlocksClient.enterRoom(roomId);

        room = room_;

        // listen to game events
        room.subscribe("event", (o) => {
          console.log("event", o);
        });

        // update connected remote from other presences
        const updateOthers = () => {
          const others = room?.getOthers();
          if (!others) return;

          const connectedRemotes = others.map((o) => o.presence) as {
            remoteId: string;
            hand: "right" | "left";
          }[];

          if (state.type === "remote")
            connectedRemotes.unshift({
              remoteId: state.remoteId,
              hand: state.hand,
            });

          if (
            (state.type === "lobby" ||
              state.type === "remote" ||
              state.type === "game") &&
            !deepEqual(state.type, connectedRemotes)
          )
            setState({ ...state, connectedRemotes });
        };

        room.waitUntilPresenceReady().then(updateOthers);
        room.subscribe("others", updateOthers);

        return leave;
      },
    );

    // set user data
    subscribeToChange(
      (state) =>
        state.type === "remote"
          ? { remoteId: state.remoteId, hand: state.hand }
          : undefined,

      (data) => {
        if (data && room) room.updatePresence(data);
      },

      { equalsFn: deepEqual },
    );
  }

  const createRoom = () => {
    const roomId = generateRandomId();
    setState({
      type: "lobby",
      roomId,
      connectedRemotes: [],
    });
  };

  const dispose = () => {
    disposeSubscribable();
    disposeSubscribeToChange();
  };

  return { getState, subscribe, createRoom, dispose };
};

const generateRandomId = () => Math.random().toString(36).slice(2);
