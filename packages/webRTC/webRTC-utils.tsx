import { signalBroadcast, signalListen } from "./signal";

const rtcConfiguration: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.mystunserver.tld" }],
};

type Message =
  | { type: "host-offer"; slot: string; offer: any }
  | { type: "host-candidate"; slot: string; candidate: any }
  | { type: "guest-answer"; slot: string; answer: any }
  | { type: "guest-candidate"; slot: string; candidate: any };

export const host = (
  key: string,
  {
    debug,
    signal,
  }: { signal?: AbortSignal; debug?: (...args: any[]) => void } = {}
) => {
  const peerConnection = new RTCPeerConnection(rtcConfiguration);

  let resolve: (d: RTCDataChannel) => void;
  let reject: (error: Error) => void;
  let dataChannelPromise = new Promise<RTCDataChannel>((r, s) => {
    resolve = r;
    reject = s;
  });

  // report connection status
  peerConnection.addEventListener("connectionstatechange", () =>
    debug?.("connection status", peerConnection.connectionState)
  );

  // clean up on abort
  signal?.addEventListener("abort", () => peerConnection.close());

  const slot = Math.random().toString().slice(2);

  // broadcast ice candidate
  peerConnection.addEventListener("icecandidate", async ({ candidate }) => {
    if (!candidate) return;

    debug?.("got ice candidate");

    debug?.("broadcasting ice candidate...");

    try {
      await signalBroadcast<Message>(key, {
        type: "host-candidate",
        slot,
        candidate,
      });
    } catch (err: any) {
      reject(err);
    }
  });

  // broadcast offer
  let currentOfferGeneration = 1;
  peerConnection.addEventListener("negotiationneeded", async (event) => {
    currentOfferGeneration++;
    const generation = currentOfferGeneration;

    try {
      debug?.("creating offer...");

      const offer = await peerConnection.createOffer();

      if (generation !== currentOfferGeneration) return;

      debug?.("setting local description");

      await peerConnection.setLocalDescription(offer);

      debug?.("broadcasting new offer");
      await signalBroadcast<Message>(key, { type: "host-offer", slot, offer });
    } catch (err: any) {
      reject(err);
    }
  });

  // listen to signaling server
  {
    const pendingRemoteIceCandidate: RTCIceCandidateInit[] = [];

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
        case "closed":
        case "disconnected":
        case "failed":
          pollingDuration = 3000000;
          break;
      }
    });
    const unsubscribe = signalListen<Message>(
      key,
      async (messages) => {
        try {
          for (const message of messages) {
            if (message.slot !== slot) continue;

            if (message.type === "guest-candidate") {
              if (!peerConnection.currentRemoteDescription)
                pendingRemoteIceCandidate.push(message.candidate);
              else await peerConnection.addIceCandidate(message.candidate);
            }

            if (
              message.type === "guest-answer" &&
              !peerConnection.currentRemoteDescription
            ) {
              const answer = new RTCSessionDescription(message.answer);
              await peerConnection.setRemoteDescription(answer);

              while (pendingRemoteIceCandidate[0])
                await peerConnection.addIceCandidate(
                  pendingRemoteIceCandidate.shift()!
                );
            }
          }
        } catch (err: any) {
          reject(err);
        }
      },
      { pollingDuration: () => pollingDuration }
    );

    signal?.addEventListener("abort", unsubscribe);
  }

  const dataChannel = peerConnection.createDataChannel("MyApp Channel");

  dataChannel.addEventListener("error", (event) =>
    reject(new Error("error while opening channel"))
  );

  dataChannel.addEventListener("open", () => resolve(dataChannel));

  return { peerConnection, dataChannelPromise };
};

export const join = (
  key: string,
  {
    debug,
    signal,
  }: { signal?: AbortSignal; debug?: (...args: any[]) => void } = {}
) => {
  const peerConnection = new RTCPeerConnection(rtcConfiguration);

  let resolve: (d: RTCDataChannel) => void;
  let reject: (error: Error) => void;
  let dataChannelPromise = new Promise<RTCDataChannel>((r, s) => {
    resolve = r;
    reject = s;
  });

  let slot: string | undefined;

  // report connection status
  peerConnection.addEventListener("connectionstatechange", () =>
    debug?.("connection status", peerConnection.connectionState)
  );

  // clean up on abort
  signal?.addEventListener("abort", () => peerConnection.close());

  // broadcast ice candidate
  const pendingLocalIceCandidate: RTCIceCandidateInit[] = [];

  const pendingRemoteIceCandidate: RTCIceCandidateInit[] = [];

  let postConnectionTimeout: Timer | undefined;
  peerConnection.addEventListener("connectionstatechange", () => {
    if (peerConnection.connectionState === "connected")
      clearTimeout(postConnectionTimeout);
  });

  peerConnection.addEventListener("icecandidate", async ({ candidate }) => {
    if (!candidate) return;

    debug?.("got ice candidate");

    if (!slot) {
      pendingLocalIceCandidate.push(candidate);

      return;
    }

    try {
      debug?.("broadcasting ice candidate...");
      await signalBroadcast<Message>(key, {
        type: "guest-candidate",
        slot,
        candidate,
      });
    } catch (err) {
      console.error(err);
      debugger;
    }
  });

  // listen to signaling server
  {
    const messagesToReplay: Extract<Message, { type: "host-candidate" }>[] = [];

    const availableOffers: {
      offer: RTCSessionDescriptionInit;
      slot: string;
    }[] = [];

    const tryOffer = async () => {
      if (slot) return;

      const a = availableOffers.shift();
      if (!a) return;

      debug?.("found available offer");

      debug?.("setting remote description");
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(a.offer)
      );

      slot = a.slot;
      onMessage(messagesToReplay);

      while (pendingLocalIceCandidate[0]) {
        debug?.("broadcasting local pending ice candidate...");
        await signalBroadcast<Message>(key, {
          type: "guest-candidate",
          candidate: pendingRemoteIceCandidate.shift(),
          slot,
        });
      }

      debug?.("creating answer");
      const answer = await peerConnection.createAnswer();

      debug?.("setting local description");
      await peerConnection.setLocalDescription(answer);

      debug?.("broadcasting answer");
      await signalBroadcast(key, { type: "guest-answer", slot, answer });

      postConnectionTimeout = setTimeout(() => {
        debug?.("no connection after X second, it failed");

        peerConnection.restartIce();
        slot = undefined;

        tryOffer();
      }, 6000);
    };

    const onMessage = async (messages: Message[]) => {
      try {
        for (const message of messages) {
          if (message.type === "host-offer") availableOffers.push(message);

          if (message.type === "guest-answer") {
            const i = availableOffers.findIndex((a) => a.slot === message.slot);
            if (i > -1) availableOffers.splice(i, 1);
          }

          if (message.type === "host-candidate" && message.slot === slot) {
            await peerConnection.addIceCandidate(message.candidate);
          } else if (message.type === "host-candidate") {
            messagesToReplay.push(message);
          }
        }

        if (!slot) debug?.("no available offer, waiting...");
      } catch (err: any) {
        reject(err);
      }

      tryOffer();
    };

    // dynamic polling duration
    let pollingDuration = 3000;
    const unsubscribe = signalListen<Message>(key, onMessage, {
      pollingDuration: () => pollingDuration,
    });

    signal?.addEventListener("abort", unsubscribe);
  }

  peerConnection.addEventListener("datachannel", (event) => {
    if (event.channel.readyState === "open") resolve(event.channel);

    event.channel.addEventListener("error", (event) =>
      reject(new Error("error while opening channel"))
    );

    event.channel.addEventListener("open", () => resolve(event.channel));
  });

  return { peerConnection, dataChannelPromise };
};
