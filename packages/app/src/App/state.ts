import { createGuest, createHost } from "@bongbong/webRTC/multi-host";
import { Game, Hand, InputKind, Track } from "./game";

type Message =
  | { type: "remote-description"; hand: Hand }
  | { type: "ping"; requestLocalDate: number }
  | { type: "pong"; requestLocalDate: number; answerRemoteDate: number }
  | { type: "remote-input"; timestamp: number; kind: InputKind; hand: Hand };

export const createHostState = (roomKey: string) => {
  const { subscribe, broadcast: broadcastStateChange } = createSubscribable();

  const host = createHost<Message>(roomKey);

  host.subscribeToGuestChange(() => {
    const remotes = host.getGuests().map((id) => ({
      id,
      hand: "right" as Hand,
      ...state.remotes.find((r) => r.id === id),
    }));

    state.remotes = remotes;

    broadcastStateChange();

    pingLoop();
  });

  let timeoutLoop: number | Timer | undefined;
  const pingLoop = () => {
    clearTimeout(timeoutLoop);

    host.broadcast({ type: "ping", requestLocalDate: Date.now() });

    timeoutLoop = setTimeout(pingLoop, 15 * 1000);
  };

  const remotePing = new Map<string, { ping: number; delta: number }>();

  host.subscribe((data) => {
    if (data.type === "pong") {
      const ping = Date.now() - data.requestLocalDate;
      const delta = Date.now() - (data.answerRemoteDate - ping / 2);
      remotePing.set(data.sender, { delta, ping });
    }

    if (data.type === "remote-description") {
      const remotes = state.remotes.map((r) =>
        r.id === data.sender ? { ...r, hand: data.hand } : r
      );
      state = { ...state, remotes };
      broadcastStateChange();
    }

    if (data.type === "remote-input") {
      const { delta, ping } = remotePing.get(data.sender) ?? {
        ping: 0,
        delta: 0,
      };

      if (state.game && audioTracker) {
        const timestamp = (Date.now() - ping / 2) / 1000;
        const input = {
          kind: data.kind,
          hand: data.hand,
          time: audioTracker.getTime(timestamp),
        };

        state = {
          ...state,
          game: { ...state.game, inputs: [...state.game.inputs, input] },
        };
        broadcastStateChange();
      }
    }
  });

  type State = {
    remotes: { id: string; hand: Hand }[];
    game: Game | undefined;
  };

  let state: State = {
    remotes: [],
    game: undefined,
  };

  let audioTracker: ReturnType<typeof createAudioTracker>;

  const startGame = (track: Track) => {
    audioTracker = createAudioTracker(track.audio);
    track.audio.currentTime = 0;
    track.audio.play();

    state = { ...state, game: { track, inputs: [] } };
    broadcastStateChange();
  };

  return {
    subscribe,
    getState: () => state,
    dispose: () => {
      if (state.game?.track.audio) {
        state.game.track.audio.pause();
      }
      audioTracker.dispose();
      host.dispose();
    },

    startGame,
  };
};

export const createGuestState = (roomKey: string) => {
  const { subscribe, broadcast: broadcastStateChange } = createSubscribable();

  const guest = createGuest<Message>(roomKey);

  type State = {
    connectionStatus: ReturnType<typeof guest.getStatus>;
    description: { hand: Hand };
    inputs: { timestamp: number; kind: InputKind }[];
  };
  let state: State = {
    connectionStatus: guest.getStatus(),
    description: { hand: "right" },
    inputs: [],
  };

  guest.subscribeToStatusChange(() => {
    state = { ...state, connectionStatus: guest.getStatus() };
    broadcastStateChange();
  });

  guest.subscribe((data) => {
    if (data.type === "ping") {
      guest.send({
        type: "pong",
        answerRemoteDate: Date.now(),
        requestLocalDate: data.requestLocalDate,
      });
    }
  });

  const setRemoteDescription = (hand: Hand) => {
    state = { ...state, description: { hand } };

    guest.send({ type: "remote-description", hand });

    broadcastStateChange();
  };

  const inputRemote = (kind: InputKind) => {
    const input = { kind, timestamp: Date.now(), hand: state.description.hand };

    state = { ...state, inputs: [...state.inputs, input] };

    broadcastStateChange();

    guest.send({ type: "remote-input", ...input });
  };

  return {
    subscribe,
    getState: () => state,
    dispose: () => {
      guest.dispose();
    },

    setRemoteDescription,
    inputRemote,
  };
};

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

/**
 * track the audio time relative to the global timestamp (of this device)
 *
 * in the ideal case it does t - <start_play_date> but is suppose to mitigate buffering occurring
 */
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
