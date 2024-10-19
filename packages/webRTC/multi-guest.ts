import { createSubscribable } from "../app/src/utils/subscribable";
import {
  Pipe,
  SignalMessage as Pipe_SignalMessage,
  host as pipe_host,
  join as pipe_join,
} from "./pipe";
import { signalBroadcast, signalListen } from "./signal";

export type SignalMessage =
  | {
      type: "host-offer";
      offerKey: string;
      answerKey?: undefined;
      offer: RTCSessionDescriptionInit;
    }
  | {
      type: "host-candidate";
      offerKey: string;
      answerKey?: undefined;
      candidate: RTCIceCandidate;
    }
  | {
      type: "guest-answer";
      offerKey: string;
      answerKey: string;
      answer: RTCSessionDescriptionInit;
    }
  | {
      type: "guest-candidate";
      offerKey: string;
      answerKey: string;
      candidate: RTCIceCandidate;
    };

export const createHost = <
  InMessage extends {} = any,
  OutMessage extends {} = InMessage
>(
  roomKey: string
) => {
  type C = {
    dispatchSignalMessage: (message: Pipe_SignalMessage) => void;
    pipe: Pipe;
    status: "pending" | "closed" | "connected";
    offerKey: string;
    answerKey?: string;
  };

  const { subscribe: subscribeToMessage, broadcast: dispatchMessage } =
    createSubscribable<InMessage & { sender: string }>();

  const { subscribe: subscribeToGuestChange, broadcast: dispatchGuestChange } =
    createSubscribable<void>();

  const channels = new Map<string, C>();

  let closed = false;

  const messagesToReplay: SignalMessage[] = [];

  signalListen<SignalMessage>(
    roomKey,
    (ms) => {
      for (const message of ms) {
        const c = channels.get(message.offerKey);
        if (!c) continue;

        if (!c.answerKey && message.type === "guest-answer") {
          c.answerKey = message.answerKey;

          c.dispatchSignalMessage(message);

          for (const message of messagesToReplay)
            if (
              message.offerKey === c.offerKey &&
              message.answerKey === c.answerKey
            )
              c.dispatchSignalMessage(message);
        }

        if (c.answerKey && message.answerKey === c.answerKey)
          c.dispatchSignalMessage(message);
      }

      messagesToReplay.push(...ms);
    },
    { pollingDuration: 3000 }
  );

  const refresh = () => {
    // ensure that there is always one slot open

    if (closed) return;

    if (![...channels.values()].some((c) => c.status === "pending"))
      createSlot();
  };

  const createSlot = () => {
    const offerKey = generateKey();

    console.debug("opening new peer connection", offerKey);

    const {
      subscribe: subscribeToSignalMessage,
      broadcast: dispatchSignalMessage,
    } = createSubscribable<Pipe_SignalMessage>();

    const pipe = pipe_host({
      subscribe: subscribeToSignalMessage,
      broadcast(m) {
        return signalBroadcast<SignalMessage>(roomKey, {
          offerKey,
          ...m,
        } as any);
      },
    });

    const c: C = { pipe, offerKey, status: "pending", dispatchSignalMessage };
    channels.set(offerKey, c);

    const unsubscribe = pipe.subscribeToMessage((data) => {
      const m = { sender: offerKey, ...JSON.parse(data) };
      dispatchMessage(m);
    });
    pipe.errorPromise.catch((err) => {
      console.debug("peer connection closed", err);

      c.status = "closed";
      unsubscribe();
      pipe.dispose();
      channels.delete(offerKey);
      refresh();

      dispatchGuestChange();
    });
    pipe.readyPromise.then(() => {
      console.debug("peer connection ready");

      c.status = "connected";
      refresh();

      dispatchGuestChange();
    });
  };

  refresh();

  return {
    getGuests: () =>
      [...channels.values()]
        .filter((c) => c.status === "connected")
        .map((c) => c.offerKey),

    subscribeToGuestChange,

    subscribeToMessage,

    dispose: () => {
      closed = true;
      for (const c of channels.values()) c.pipe.dispose();
      channels.clear();
    },

    broadcast: (m: OutMessage) =>
      Promise.all(
        [...channels.values()]
          .filter((c) => c.status === "connected")
          .map((c) => c.pipe.send(JSON.stringify(m)))
      ),

    send: (slot: string, m: OutMessage) => {
      const c = channels.get(slot);
      if (c?.status !== "connected") throw new Error("channel not open");
      c.pipe.send(JSON.stringify(m));
    },
  };
};

export const createGuest = <
  InMessage extends {} = any,
  OutMessage extends {} = InMessage
>(
  roomKey: string
) => {
  const { subscribe: subscribeToMessage, broadcast: dispatchMessage } =
    createSubscribable<InMessage & { sender: string }>();

  const {
    subscribe: subscribeToStatusChange,
    broadcast: dispatchStatusChange,
  } = createSubscribable<void>();

  let activePipe:
    | {
        status: "pending" | "closed" | "connected";
        dispatchSignalMessage: (message: Pipe_SignalMessage) => void;
        pipe: Pipe;
        offerKey: string;
        answerKey: string;
      }
    | undefined;

  const allMessages: SignalMessage[] = [];

  const usedOffer = new Set<string>();

  // dynamic polling duration
  let pollingDuration = 2000;
  subscribeToStatusChange(() => {
    pollingDuration = (activePipe?.status === "connected" && 30 * 1000) || 2000;
  });

  const onMessage = (ms: SignalMessage[]) => {
    if (activePipe) {
      for (const m of ms) {
        if (m.offerKey === activePipe.offerKey)
          activePipe.dispatchSignalMessage(m);
      }
    }

    if (!activePipe) {
      const lastOfferKey = ms.findLast(
        (m) =>
          m.type === "host-offer" &&
          !usedOffer.has(m.offerKey) &&
          !allMessages.some(
            (m2) => m2.type === "guest-answer" && m2.offerKey === m.offerKey
          )
      )?.offerKey;

      if (lastOfferKey) {
        const offerKey = lastOfferKey;

        usedOffer.add(offerKey);

        const {
          subscribe: subscribeToSignalMessage,
          broadcast: dispatchSignalMessage,
        } = createSubscribable<Pipe_SignalMessage>();

        const answerKey = generateKey();

        const pipe = pipe_join({
          subscribe: subscribeToSignalMessage,
          broadcast(m) {
            return signalBroadcast<SignalMessage>(roomKey, {
              offerKey,
              answerKey,
              ...m,
            } as any);
          },
        });

        pipe.subscribeToMessage((data) => dispatchMessage(JSON.parse(data)));

        activePipe = {
          pipe,
          offerKey,
          answerKey,
          dispatchSignalMessage,
          status: "pending",
        };

        const a = activePipe;

        pipe.errorPromise.catch(() => {
          pipe.dispose();
          a.status = "closed";
          if (a === activePipe) {
            activePipe = undefined;
            onMessage(allMessages);
            dispatchStatusChange();
          }
        });

        pipe.readyPromise.then(() => {
          a.status = "connected";
          if (a === activePipe) dispatchStatusChange();
        });

        onMessage(allMessages);
      }
    }
  };

  signalListen<SignalMessage>(
    roomKey,
    (ms) => {
      allMessages.push(...ms);
      onMessage(ms);
    },
    { pollingDuration: () => pollingDuration }
  );

  return {
    subscribeToMessage,

    dispose: () => {
      activePipe?.pipe.dispose();
      activePipe = undefined;
    },

    send: (m: OutMessage) => {
      if (activePipe?.status === "connected")
        activePipe.pipe.send(JSON.stringify(m));
    },

    subscribeToStatusChange,

    getStatus() {
      if (!activePipe) return "pending";
      return activePipe.status;
    },
  };
};

const generateKey = () => Math.random().toString(36).slice(2);
