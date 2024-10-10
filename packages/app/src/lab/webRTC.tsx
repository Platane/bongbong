import { signalGet, signalListen, signalSend } from "./signal";

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

  const iceCandidatePromise = new Promise<RTCIceCandidate>((resolve) => {
    peerConnection.addEventListener("icecandidate", (event) => {
      if (!event.candidate) return;

      resolve(event.candidate);
    });
  });

  iceCandidatePromise.then(() => debug?.("local candidate ready"));

  debug?.("creating data channel");

  const dataChannel = peerConnection.createDataChannel("MyApp Channel");

  debug?.("waiting for offer and local candidate...");

  const [offer, localCandidate] = await Promise.all([
    peerConnection.createOffer().then(async (offer) => {
      debug?.("offer created");

      debug?.("setting local description...");
      await peerConnection.setLocalDescription(offer);

      debug?.("local description set");

      return offer;
    }),
    iceCandidatePromise,
  ]);

  debug?.("sending offer and candidate...", localCandidate, offer);

  signalSend(key + "_offer", { offer, candidate: localCandidate }, { signal });

  debug?.("waiting for answer...");

  const { answer, candidate: remoteCandidate } = await signalListen(
    key + "_answer",
    {
      signal,
      pollingDuration: 4000,
      debug: debug && ((...args) => debug("polling for answer", ...args)),
    }
  );

  debug?.("got an answer");

  debug?.("setting the remote description");
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

  debug?.("setting the remote ice candidate");
  await peerConnection.addIceCandidate(remoteCandidate);

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

  const iceCandidatePromise = new Promise<RTCIceCandidate>((resolve) => {
    peerConnection.addEventListener("icecandidate", (event) => {
      if (!event.candidate) return;

      resolve(event.candidate);
    });
  });
  iceCandidatePromise.then(() => debug?.("local candidate ready"));

  const dataChannelPromise = new Promise<RTCDataChannel>((resolve) => {
    peerConnection.addEventListener("datachannel", (event) =>
      resolve(event.channel)
    );
  });
  dataChannelPromise.then(() => debug?.("datachannel discovered"));

  debug?.("fetching offer...");
  const { offer, candidate: remoteCandidate } = await signalGet(
    key + "_offer",
    { signal }
  );

  debug?.("got the offer");

  debug?.("setting remote description...");
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  debug?.("setting remote ice candidate...");
  await peerConnection.addIceCandidate(remoteCandidate);

  debug?.("creating answer...");
  const answer = await peerConnection.createAnswer();

  debug?.("setting local description...");
  await peerConnection.setLocalDescription(answer);

  const localCandidate = await iceCandidatePromise;

  debug?.("sending answer...");
  await signalSend(key + "_answer", { candidate: localCandidate, answer });

  debug?.("answer sent...");

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
