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

  // does it make it connect faster?
  liveBlocksClient.enterRoom("lobby");

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
        if (!roomId) return;

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
            time: audioTracker.getTime(event.timestamp),
          };

          if (!isInput(input)) return;

          setState({ ...state, game: registerInput(state.game, input) });
        });

        // first update does not contains the others somehow
        let joinedOnce = false;

        // update connected remote from other presences
        room.subscribe("others", () => {
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
        });

        room.subscribe("status", () => {
          if (!room) return;
          switch (room.getStatus()) {
            case "connected":
              if (state.type === "viewer" || state.type === "remote")
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

  let audioTracker: ReturnType<typeof createAudioTracker>;

  const startGame = (track: Game["track"], goals: Game["goals"]) => {
    if (state.type !== "viewer") return;
    // if (state.connectionStatus !== "ready") return;

    audioTracker?.dispose();
    audioTracker = createAudioTracker(track.audio);
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
      timestamp: Date.now() / 1000,
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

  const markRemoteUnsupported = () => {
    if (state.type === "remote" || state.type === "room-closed") {
      setState({ type: "remote-unsupported", roomId: state.roomId });
    }
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
    markRemoteUnsupported,
  };
};

const generateRandomId = () => Math.random().toString(36).slice(2);

const createAudioTracker = (audio: HTMLAudioElement) => {
  const abortController = new AbortController();

  const keys = [] as { time: number; timestamp: number }[];

  const addKey = () =>
    keys.push({ timestamp: Date.now() / 1000, time: audio.currentTime });

  addKey();

  const o = { signal: abortController.signal };
  audio.addEventListener("cuechange", addKey, o);
  audio.addEventListener("durationchange", addKey, o);
  audio.addEventListener("ended", addKey, o);
  audio.addEventListener("pause", addKey, o);
  audio.addEventListener("play", addKey, o);
  audio.addEventListener("playing", addKey, o);
  audio.addEventListener("ratechange", addKey, o);
  audio.addEventListener("seeked", addKey, o);

  const getTime = (timestamp: number) => {
    if (timestamp < keys[0].timestamp) return keys[0].time;

    keys.push({ timestamp: Date.now() / 1000, time: audio.currentTime });

    let i = 0;
    for (; keys[i + 1] && keys[i + 1].timestamp < timestamp; i++);

    const a = keys[i];
    const b = keys[i + 1];

    keys.pop();

    if (!b) return a.time;

    const k = (a.timestamp - timestamp) / (a.timestamp - b.timestamp);

    return a.time + (b.time - a.time) * k;
  };
  const dispose = () => {
    abortController.abort();
  };

  return { getTime, dispose };
};
