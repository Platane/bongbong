import {
  Pipe,
  SignalMessage as Pipe_SignalMessage,
  host as pipe_host,
  join as pipe_join,
} from "./pipe";
import { signalBroadcast, signalListen } from "./signal";

type Message = Pipe_SignalMessage & { slot: string };

export const createHost = <
  InMessage extends {} = any,
  OutMessage extends {} = InMessage
>(
  roomKey: string
) => {
  type C = {
    listeners: Set<(message: Pipe_SignalMessage) => void>;
    pipe: Pipe;
    status: "pending" | "closed" | "connected";
    slot: string;
  };

  const messageListeners = new Set<
    (data: InMessage & { sender: string }) => void
  >();
  const guestListeners = new Set<() => void>();

  const channels = new Map<string, C>();

  let pollingDuration = 3000;

  let closed = false;

  signalListen<Message>(
    roomKey,
    (messages) => {
      for (const message of messages)
        for (const l of channels.get(message.slot)?.listeners ?? []) l(message);
    },
    { pollingDuration: () => pollingDuration }
  );

  const refresh = () => {
    // ensure that there is always one slot open

    if (closed) return;

    if (![...channels.values()].some((c) => c.status === "pending"))
      createSlot();
  };

  const createSlot = () => {
    const slot = Math.random().toString(36).slice(2);
    const listeners = new Set<(m: Pipe_SignalMessage) => void>();
    const pipe = pipe_host({
      subscribe(h) {
        listeners.add(h);
        return () => listeners.delete(h);
      },
      broadcast(m) {
        return signalBroadcast<Message>(roomKey, { ...m, slot });
      },
    });
    const c: C = {
      pipe,
      slot,
      status: "pending",
      listeners,
    };
    channels.set(slot, c);
    const unsubscribe = pipe.subscribeToMessage((data) => {
      const m = { ...JSON.parse(data), sender: slot };
      for (const l of messageListeners) l(m);
    });
    pipe.errorPromise.catch((err) => {
      c.status = "closed";
      unsubscribe();
      pipe.dispose();
      channels.delete(slot);
      refresh();

      for (const l of guestListeners) l();
    });
    pipe.readyPromise.then(() => {
      c.status = "connected";
      refresh();

      for (const l of guestListeners) l();
    });
  };

  refresh();

  return {
    getGuests: () =>
      [...channels.values()]
        .filter((c) => c.status === "connected")
        .map((c) => c.slot),

    subscribeToGuestChange: (h: () => void) => {
      guestListeners.add(h);
      return () => guestListeners.delete(h);
    },

    subscribe: (h: (data: InMessage & { sender: string }) => void) => {
      messageListeners.add(h);
      return () => messageListeners.delete(h);
    },

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
  const messageListeners = new Set<(data: InMessage) => void>();

  let activePipe:
    | {
        status: "pending" | "closed" | "connected";
        listeners: Set<(message: Pipe_SignalMessage) => void>;
        pipe: Pipe;
        slot: string;
      }
    | undefined;

  const messages: Message[] = [];

  const usedSlots = new Set<string>();

  const statusListeners = new Set<() => void>();

  // dynamic polling duration
  let pollingDuration = 2000;
  statusListeners.add(() => {
    pollingDuration = (activePipe?.status === "connected" && 30 * 1000) || 2000;
  });

  const onMessage = (ms: Message[]) => {
    if (activePipe) {
      for (const m of ms)
        if (m.slot === activePipe.slot)
          for (const l of activePipe.listeners) l(m);
    }

    if (!activePipe) {
      const lastOfferSlot = ms.findLast(
        (m) =>
          m.type === "host-offer" &&
          !usedSlots.has(m.slot) &&
          !messages.some(
            (m2) => m2.type === "guest-answer" && m2.slot === m.slot
          )
      )?.slot;

      if (lastOfferSlot) {
        const slot = lastOfferSlot;

        usedSlots.add(slot);

        const listeners = new Set<(m: Pipe_SignalMessage) => void>();
        const pipe = pipe_join({
          subscribe(h) {
            listeners.add(h);
            return () => listeners.delete(h);
          },
          broadcast(m) {
            return signalBroadcast<Message>(roomKey, { ...m, slot });
          },
        });

        pipe.subscribeToMessage((data) => {
          for (const l of messageListeners) l(JSON.parse(data));
        });

        activePipe = {
          pipe,
          slot: lastOfferSlot,
          listeners,
          status: "pending",
        };

        const a = activePipe;

        pipe.errorPromise.catch(() => {
          a.status = "closed";
          if (a === activePipe) {
            activePipe = undefined;
            onMessage(ms);
            for (const l of statusListeners) l();
          }
        });

        pipe.readyPromise.then(() => {
          a.status = "connected";
          if (a === activePipe) for (const l of statusListeners) l();
        });

        onMessage(ms);
      }
    }
  };

  signalListen<Message>(
    roomKey,
    (ms) => {
      messages.push(...ms);
      onMessage(ms);
    },
    { pollingDuration: () => pollingDuration }
  );

  return {
    subscribe: (h: (data: InMessage) => void) => {
      messageListeners.add(h);
      return () => messageListeners.delete(h);
    },

    dispose: () => {
      activePipe?.pipe.dispose();
      activePipe = undefined;
    },

    send: (m: OutMessage) => {
      if (activePipe?.status === "connected")
        activePipe.pipe.send(JSON.stringify(m));
    },

    subscribeToStatusChange: (h: () => void) => {
      statusListeners.add(h);
      return () => statusListeners.delete(h);
    },

    getStatus() {
      if (!activePipe) return "pending";
      return activePipe.status;
    },
  };
};
