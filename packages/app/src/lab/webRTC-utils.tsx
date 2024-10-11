import { signalBroadcast, signalListen } from "./signal";

const rtcConfiguration: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.mystunserver.tld" }],
};

export const host = async (
  key: string,
  {
    debug,
    signal,
  }: { signal?: AbortSignal; debug?: (...args: any[]) => void } = {}
) => {
  const peerConnection = new RTCPeerConnection(rtcConfiguration);

  // report connection status
  peerConnection.addEventListener("connectionstatechange", () =>
    debug?.("connection status", peerConnection.connectionState)
  );

  // clean up on abort
  signal?.addEventListener("abort", () => peerConnection.close());

  // broadcast ice candidate
  peerConnection.addEventListener("icecandidate", async ({ candidate }) => {
    if (!candidate) return;

    try {
      await signalBroadcast(key, { type: "host-candidate", candidate });
    } catch (err) {
      console.error(err);
      debugger;
    }
  });

  // broadcast offer
  let currentOfferGeneration = 1;
  peerConnection.addEventListener("negotiationneeded", async (event) => {
    currentOfferGeneration++;
    const generation = currentOfferGeneration;

    try {
      const offer = await peerConnection.createOffer();

      if (generation !== currentOfferGeneration) return;

      await peerConnection.setLocalDescription(offer);

      await signalBroadcast(key, { type: "host-offer", offer });
    } catch (err) {
      console.error(err);
      debugger;
    }
  });

  // listen to signaling server
  const pendingRemoteIceCandidate: RTCIceCandidateInit[] = [];
  signalListen(key, async (message) => {
    try {
      if (message.type === "guest-candidate") {
        if (!peerConnection.currentRemoteDescription)
          pendingRemoteIceCandidate.push(message.candidate);
        else await peerConnection.addIceCandidate(message.candidate);
      }

      if (message.type === "guest-answer") {
        const answer = new RTCSessionDescription(message.answer);
        await peerConnection.setRemoteDescription(answer);

        while (pendingRemoteIceCandidate[0])
          await peerConnection.addIceCandidate(
            pendingRemoteIceCandidate.shift()!
          );
      }
    } catch (err) {
      console.error(err);
      debugger;
    }
  });

  const dataChannel = peerConnection.createDataChannel("MyApp Channel");

  debug?.("waiting for data channel ready...");
  await new Promise<void>((resolve, reject) => {
    if (dataChannel.readyState === "open") resolve();

    dataChannel.addEventListener("error", (event) =>
      reject(new Error("error while opening channel"))
    );

    dataChannel.addEventListener("open", resolve as any);
  });

  return dataChannel;
};

export const join = async (
  key: string,
  {
    debug,
    signal,
  }: { signal?: AbortSignal; debug?: (...args: any[]) => void } = {}
) => {
  const peerConnection = new RTCPeerConnection(rtcConfiguration);

  // report connection status
  peerConnection.addEventListener("connectionstatechange", () =>
    debug?.("connection status", peerConnection.connectionState)
  );

  // clean up on abort
  signal?.addEventListener("abort", () => peerConnection.close());

  // broadcast ice candidate
  peerConnection.addEventListener("icecandidate", async ({ candidate }) => {
    if (!candidate) return;

    try {
      await signalBroadcast(key, { type: "guest-candidate", candidate });
    } catch (err) {
      console.error(err);
      debugger;
    }
  });

  // listen to signaling server
  const pendingRemoteIceCandidate: RTCIceCandidateInit[] = [];
  signalListen(key, async (message) => {
    try {
      if (message.type === "host-candidate") {
        if (!peerConnection.currentRemoteDescription)
          pendingRemoteIceCandidate.push(message.candidate);
        else await peerConnection.addIceCandidate(message.candidate);
      }

      if (message.type === "host-offer") {
        debugger;

        const offer = new RTCSessionDescription(message.offer);
        await peerConnection.setRemoteDescription(offer);

        while (pendingRemoteIceCandidate[0])
          await peerConnection.addIceCandidate(
            pendingRemoteIceCandidate.shift()!
          );

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        await signalBroadcast(key, { type: "guest-answer", answer });
      }
    } catch (err) {
      console.error(err);
      debugger;
    }
  });

  const dataChannelPromise = new Promise<RTCDataChannel>((resolve) => {
    peerConnection.addEventListener("datachannel", (event) =>
      resolve(event.channel)
    );
  });
  dataChannelPromise.then(() => debug?.("datachannel discovered"));

  debug?.("waiting for data channel...");
  const dataChannel = await dataChannelPromise;

  debug?.("waiting for data channel ready...");
  await new Promise<void>((resolve, reject) => {
    if (dataChannel.readyState === "open") resolve();

    dataChannel.addEventListener("error", (event) =>
      reject(new Error("error while opening channel"))
    );

    dataChannel.addEventListener("open", resolve as any);
  });

  //
  peerConnection.addEventListener("negotiationneeded", () =>
    debug?.(
      "negotiationneeded event after initiation; we should probably reset"
    )
  );

  return dataChannel;
};
