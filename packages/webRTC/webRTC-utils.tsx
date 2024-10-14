import { signalBroadcast, signalListen } from "./signal";

const rtcConfiguration: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.mystunserver.tld" }],
};

type Message =
  | { type: "host-offer"; slot: string; offer: any }
  | { type: "host-candidate"; slot: string; candidate: any }
  | { type: "guest-answer"; slot: string; answer: any }
  | { type: "guest-candidate"; slot: string; candidate: any };

export type Pipe = {
  send: RTCDataChannel["send"];
  dispose: () => void;
  readyPromise: Promise<void>;
  errorPromise: Promise<void>;
  subscribeToMessage: (h: (data: any) => void) => () => void;
};

export const host = (key: string): Pipe => {
  const peerConnection = new RTCPeerConnection(rtcConfiguration);

  const dataChannel = peerConnection.createDataChannel("Data Channel");

  // error promise
  let reportError: (error?: any) => void;
  let errorPromise = new Promise<void>((_, r) => (reportError = r));

  // ready promise
  let resolveReady: () => void;
  let readyPromise = new Promise<void>((r) => (resolveReady = r));

  // attach error event
  dataChannel.addEventListener("close", (event) => reportError());
  dataChannel.addEventListener("error", (event) => reportError());

  peerConnection.addEventListener("connectionstatechange", () => {
    if (
      peerConnection.connectionState === "closed" ||
      peerConnection.connectionState === "disconnected" ||
      peerConnection.connectionState === "failed"
    ) {
      reportError();
    }
  });

  signalBroadcast(key, {});

  // attach ready event
  dataChannel.addEventListener("open", () => resolveReady());

  const slot = Math.random().toString().slice(2);

  // broadcast ice candidate
  peerConnection.addEventListener("icecandidate", async ({ candidate }) => {
    if (!candidate) return;

    signalBroadcast<Message>(key, {
      type: "host-candidate",
      slot,
      candidate,
    }).catch(reportError);
  });

  // broadcast offer
  peerConnection
    .createOffer()
    .then(async (offer) => {
      await peerConnection.setLocalDescription(offer);

      await signalBroadcast<Message>(key, { type: "host-offer", slot, offer });
    })
    .catch((err) => reportError(err));

  // listen to signaling server

  // dynamic polling duration
  let pollingDuration = 3000;
  peerConnection.addEventListener("connectionstatechange", () => {
    switch (peerConnection.connectionState) {
      case "connecting":
      case "new":
        pollingDuration = 3000;
        break;
      case "connected":
        pollingDuration = 30000;
        break;
      default:
        pollingDuration = 3000000;
        break;
    }
  });

  const toReplayMessages: Message[] = [];
  const onMessage = (message: Message) => {
    if (message.slot !== slot) return;

    if (
      message.type === "guest-candidate" &&
      peerConnection.currentRemoteDescription
    )
      peerConnection.addIceCandidate(message.candidate).catch(reportError);
    else if (
      message.type === "guest-answer" &&
      !peerConnection.currentRemoteDescription &&
      !peerConnection.pendingRemoteDescription
    ) {
      const answer = new RTCSessionDescription(message.answer);
      peerConnection
        .setRemoteDescription(answer)
        .then(() => {
          // replay
          const clone = [...toReplayMessages];
          toReplayMessages.length = 0;
          clone.forEach(onMessage);
        })
        .catch(reportError);
    } else toReplayMessages.push(message);
  };

  const unsubscribe = signalListen<Message>(
    key,
    (messages) => messages.forEach(onMessage),
    { pollingDuration: () => pollingDuration }
  );

  return {
    readyPromise: Promise.race([readyPromise, errorPromise]),
    errorPromise,
    send: (data) => dataChannel.send(data as any),
    dispose: () => {
      peerConnection.close();
      unsubscribe();
    },
    subscribeToMessage: (h) => {
      const mh = (event: any) => h(event.data);

      dataChannel.addEventListener("message", mh);
      return () => dataChannel.removeEventListener("message", mh);
    },
  };
};

export const join = (
  key: string,
  usedSlots: Pick<Set<string>, "has" | "add">
): Pipe => {
  const peerConnection = new RTCPeerConnection(rtcConfiguration);

  const messageListeners = new Set<(data: any) => void>();

  // error promise
  let reportError: (error?: any) => void;
  let errorPromise = new Promise<void>((_, r) => (reportError = r));

  // ready promise
  let resolveReady: () => void;
  let readyPromise = new Promise<void>((r) => (resolveReady = r));

  let timeout: Timer | undefined;

  peerConnection.addEventListener("connectionstatechange", () => {
    if (
      peerConnection.connectionState === "closed" ||
      peerConnection.connectionState === "disconnected" ||
      peerConnection.connectionState === "failed"
    ) {
      reportError();
    }

    if (peerConnection.connectionState === "connected") clearTimeout(timeout);
  });

  let slot: string | undefined;

  const iceCandidates = new Set<RTCIceCandidate>();

  // broadcast ice candidate
  peerConnection.addEventListener("icecandidate", async ({ candidate }) => {
    if (!candidate) return;

    if (!slot) iceCandidates.add(candidate);
    else
      signalBroadcast<Message>(key, {
        type: "guest-candidate",
        slot,
        candidate,
      }).catch(reportError);
  });

  const toReplayMessages: Message[] = [];
  const onMessage = (message: Message) => {
    if (
      message.type === "host-candidate" &&
      message.slot === slot &&
      peerConnection.currentRemoteDescription
    )
      peerConnection.addIceCandidate(message.candidate).catch(reportError);
    else if (
      message.type === "host-offer" &&
      !peerConnection.currentRemoteDescription &&
      !usedSlots.has(message.slot)
    ) {
      slot = message.slot;

      peerConnection
        .setRemoteDescription(new RTCSessionDescription(message.offer))
        .then(async () => {
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          // replay
          const clone = [...toReplayMessages];
          toReplayMessages.length = 0;
          clone.forEach(onMessage);

          await signalBroadcast(key, { type: "guest-answer", slot, answer });
        })
        .catch(reportError);
    } else toReplayMessages.push(message);
  };

  const onMessages = (messages: Message[]) => {
    debugger;

    for (const message of messages) {
      if (message.type === "guest-answer") usedSlots.add(message.slot);
    }

    for (const message of messages) onMessage(message);
  };

  let pollingDuration = 3000;

  const unsubscribe = signalListen<Message>(key, onMessages, {
    pollingDuration: () => pollingDuration,
  });

  let dataChannel: RTCDataChannel | undefined;

  peerConnection.addEventListener("datachannel", (event) => {
    dataChannel = event.channel;

    if (dataChannel.readyState === "open") resolveReady();

    dataChannel.addEventListener("close", reportError);
    dataChannel.addEventListener("error", reportError);
    dataChannel.addEventListener("open", resolveReady);
    dataChannel.addEventListener("message", (event) => {
      for (const h of messageListeners) h(event.data);
    });
  });

  return {
    send: (data) => {
      if (!dataChannel) throw new Error("dataChannel not ready");
      dataChannel.send(data as any);
    },
    readyPromise: Promise.race([readyPromise, errorPromise]),
    errorPromise,
    dispose: () => {
      peerConnection.close();
      unsubscribe();
    },
    subscribeToMessage: (h) => {
      messageListeners.add(h);
      return () => messageListeners.delete(h);
    },
  };
};
