import { Room, createClient } from "@liveblocks/client";
import deepEqual from "fast-deep-equal";
import { buildRoute, parseRoute } from "./routes";
import { createInitialGame, Game, isInput, registerInput } from "./game";

type Remote = { remoteId: string; hand: "right" | "left" };

export type State<Game = any> =
  | { type: "404"; pathname: string; search: string; hash: string }
  | { type: "home" }
  | ((
      | {
          type: "viewer";
        }
      | {
          type: "remote";
          remoteId: string;
          hand: "right" | "left";
        }
    ) &
      (
        | {
            roomId: string;
            connectionStatus: "ready";
            game: Game | undefined;
            connectedRemotes: Remote[];
            leader: boolean;
          }
        | {
            roomId: string;
            connectionStatus: "connecting";
            game?: undefined;
            connectedRemotes?: undefined;
            leader?: undefined;
          }
      ));

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
  subscribe: (h: () => void) => () => void
) => {
  const cleanUps = new Set<(() => void) | undefined>();
  const subscribeToChange = <S>(
    selector: (state: State) => S,
    handler: (s: S) => void | (() => void),
    {
      equalsFn = (a, b) => a === b,
      initialTrigger = true,
    }: { equalsFn?: (a: S, b: S) => boolean; initialTrigger?: boolean } = {}
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
  let state = { type: "home" } as State<Game>;
  const getState = () => state;

  const {
    subscribe,
    broadcast,
    dispose: disposeSubscribable,
  } = createSubscribable();

  const setState = (s: typeof state) => {
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
      setState({
        type: "remote",
        remoteId: generateRandomId(),
        hand: "left",
        roomId: route.roomId,
        connectionStatus: "connecting",
      });
    }

    if (route.name === "remote") {
      setState({
        type: "remote",
        hand: "left",
        remoteId: route.remoteId,
        roomId: route.roomId,
        connectionStatus: "connecting",
      });
    }

    if (route.name === "lobby") {
      setState({
        type: "viewer",
        roomId: route.roomId,
        connectionStatus: "connecting",
      });
    }
  }

  // handle location
  subscribeToChange(
    (state) => {
      switch (state.type) {
        case "viewer":
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
    }
  );

  // handle live messaging
  let room: undefined | Room;
  {
    // enter room
    subscribeToChange(
      (state) =>
        state.type === "viewer" || state.type === "remote"
          ? state.roomId
          : null,

      (roomId) => {
        if (room?.id === roomId || !roomId) return;

        const { leave, room: room_ } = liveBlocksClient.enterRoom(roomId);

        room = room_;

        // listen to game events
        room.subscribe("event", ({ event }: any) => {
          if (
            event.type === "remote-input" &&
            isInput(event) &&
            (state.type === "viewer" || state.type === "remote") &&
            state.game
          )
            setState({ ...state, game: registerInput(state.game, event) });
        });

        // update connected remote from other presences
        const updateOthers = () => {
          if (!room) return;
          if (state.type !== "viewer" && state.type !== "remote") return;

          const others = room.getOthers();

          const connectedRemotes = others.map((o) => o.presence) as {
            remoteId: string;
            hand: "right" | "left";
          }[];

          if (state.type === "remote")
            connectedRemotes.unshift({
              remoteId: state.remoteId,
              hand: state.hand,
            });

          if (!deepEqual(state.connectedRemotes, connectedRemotes))
            setState({
              ...state,
              connectionStatus: "ready",
              connectedRemotes,
              leader: false,
            });

          //
          const selfId = room.getSelf()?.connectionId;
          if (selfId && others.every((o) => o.connectionId < selfId)) {
            setState({ ...state, leader: true } as any);
          }
        };

        room.subscribe("others", updateOthers);

        room.subscribe("status", () => {
          console.log("status", room?.getStatus());
        });

        return leave;
      }
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

      { equalsFn: deepEqual }
    );
  }

  // functions

  const createRoom = () => {
    const roomId = generateRandomId();
    if (state.type !== "home") return;
    setState({
      type: "viewer",
      roomId,
      connectionStatus: "connecting",
    });
  };

  const startGame = (track: string, goals: Game["goals"]) => {
    if (state.type !== "viewer") return;
    setState({
      ...state,
      game: createInitialGame(track, goals, Date.now()),
    });
  };

  const inputRemote = (kind: "ring" | "skin") => {
    if (state.type !== "remote" || !state.game) return;

    const timestamp = Date.now() - state.game.trackStartedDate;
    const hand = state.connectedRemotes.find(
      (r) => r.remoteId === state.remoteId
    )?.hand;

    if (!hand) return;

    const input = { kind, timestamp, hand };

    const game = registerInput(state.game, input);
    setState({ ...state, game });

    room?.broadcastEvent({
      type: "remote-input",
      ...input,
      remoteId: state.remoteId,
    });

    room?.getStorage().then((storage) => storage.root.set);
  };

  const dispose = () => {
    disposeSubscribable();
    disposeSubscribeToChange();
  };

  return {
    getState,
    subscribe,
    dispose,

    //
    createRoom,
    startGame,
    inputRemote,
  };
};

const generateRandomId = () => Math.random().toString(36).slice(2);
