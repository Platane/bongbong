import { Room, createClient } from "@liveblocks/client";
import deepEqual from "fast-deep-equal";
import { buildRoute, parseRoute } from "./routes";
import { createInitialGame, Game, isInput, registerInput } from "./game";

type Remote = { remoteId: string; hand: "right" | "left" };

const isRemote = (x: any): x is Remote =>
  x &&
  typeof x.remoteId === "string" &&
  (x.hand === "right" || x.hand === "left");

export type State<Game = any> =
  | { type: "404"; pathname: string; search: string; hash: string }
  | { type: "home" }
  | { type: "room-closed"; roomId: string; remoteId?: string }
  | { type: "remote-unsupported"; roomId: string }
  | ((
      | {
          type: "viewer";
          game: Game | undefined;
          connectedRemotes: Remote[];
        }
      | {
          type: "remote";
          remoteId: string;
          hand: "right" | "left";
        }
    ) & {
      roomId: string;
      connectionStatus: "connecting" | "ready" | "re-connecting";
    });

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
        previousValue = value;
        cleanUp = handler(value) || undefined;
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
      setState({ type: "home" });

      // setState({
      //   type: "viewer",
      //   roomId: route.roomId,
      //   connectionStatus: "connecting",
      // });
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
        case "room-closed":
          if (state.remoteId) return buildRoute({ ...state, name: "remote" });
          else return buildRoute({ name: "lobby", roomId: state.roomId });
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
          if (event.type !== "remote-input") return;
          if (state.type !== "viewer" || !state.game) return;

          const remote = state.connectedRemotes.find(
            (r) => r.remoteId === event.remoteId
          );

          if (!remote) return;

          const input = {
            kind: event.kind,
            hand: remote.hand,
            timestamp: event.globalTimestamp - state.game.trackStartedDate,
          };

          if (!isInput(input)) return;

          setState({ ...state, game: registerInput(state.game, input) });
        });

        let joinedOnce = false;

        // update connected remote from other presences
        const updateOthers = () => {
          if (!room) return;

          const others = room.getOthers();

          // update connected remotes
          if (state.type === "viewer") {
            const connectedRemotes = others
              .map((o) => o.presence)
              .filter(isRemote);

            if (!deepEqual(state.connectedRemotes, connectedRemotes))
              setState({
                ...state,
                connectionStatus: "ready",
                connectedRemotes,
              });
          }

          if (state.type === "remote") {
            const haveMaster = others.some((o) => o.presence.master);

            if (!haveMaster && joinedOnce)
              setState({
                roomId: state.roomId,
                remoteId: state.remoteId,
                type: "room-closed",
              });
          }

          joinedOnce = true;
        };

        room.subscribe("others", updateOthers);

        room.subscribe("status", () => {
          if (!room) return;
          switch (room.getStatus()) {
            case "connected":
              setState({ ...state, connectionStatus: "ready" });
          }
          console.log("status", room.getStatus());
        });

        return leave;
      }
    );

    // set user data
    subscribeToChange(
      (state) => {
        if (state.type === "remote")
          return { remoteId: state.remoteId, hand: state.hand };

        if (state.type === "viewer") return { master: true };

        return undefined;
      },

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

  const startGame = (track: Game["track"], goals: Game["goals"]) => {
    if (state.type !== "viewer") return;
    // if (state.connectionStatus !== "ready") return;

    track.audio.play();

    setState({
      ...state,
      game: createInitialGame(track, goals, Date.now()),
    });
  };

  const inputRemote = (kind: "ring" | "skin") => {
    if (state.type !== "remote") return;

    room?.broadcastEvent({
      type: "remote-input",
      globalTimestamp: Date.now() / 1000,
      remoteId: state.remoteId,
      kind,
    });
  };

  const switchHand = (hand: "left" | "right") => {
    if (state.type !== "remote") return;
    setState({ ...state, hand });
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
    switchHand,
  };
};

const generateRandomId = () => Math.random().toString(36).slice(2);
