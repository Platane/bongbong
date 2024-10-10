import { signalGet, signalListen, signalSend } from "./signal";

const rtcConfiguration: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.mystunserver.tld" }],
};

export const host = (
  key: string,
  { debug }: { debug?: (...args: any[]) => void } = {}
) => {
  const peerConnection = new RTCPeerConnection(rtcConfiguration);

  peerConnection.addEventListener("connectionstatechange", () =>
    debug?.("connection status", peerConnection.connectionState)
  );

  let offer: RTCSessionDescriptionInit;
  let localCandidate: RTCIceCandidate;
  let signaled = false;

  const after = async () => {
    if (signaled) return;

    if (!localCandidate) return;

    if (!offer) return;

    signaled = true;

    debug?.("sending offer", localCandidate, offer);

    await signalSend(key + "_offer", {
      candidate: localCandidate,
      offer,
    });

    debug?.("offer sent", localCandidate, offer);
  };

  peerConnection.addEventListener("icecandidate", (event) => {
    if (!event.candidate) return;

    debug?.("local candidate ready");

    localCandidate = event.candidate;

    after();
  });

  peerConnection.addEventListener("negotiationneeded", async (event) => {
    debug?.("negotiationneeded event");

    offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    after();
  });

  debug?.("waiting for answer");

  signalListen(key + "_answer").then(async ({ answer, candidate }) => {
    debug?.("answer ready");

    debug?.("setting remote description");

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer)
    );

    debug?.("setting remote ice candidate");

    await peerConnection.addIceCandidate(candidate);
  });

  const dataChannel = peerConnection.createDataChannel("MyApp Channel");

  return {
    peerConnection,
    getDataChannel: () => Promise.resolve(dataChannel),
    close: () => {
      peerConnection.close();
    },
  };
};

export const join = (
  key: string,
  { debug }: { debug?: (...args: any[]) => void } = {}
) => {
  const peerConnection = new RTCPeerConnection(rtcConfiguration);

  peerConnection.addEventListener("connectionstatechange", () =>
    debug?.("connection status", peerConnection.connectionState)
  );

  let localCandidate: RTCIceCandidate;
  let answer: RTCLocalSessionDescriptionInit;
  let signaled = false;

  const after = async () => {
    if (signaled) return;

    if (!localCandidate) return;

    signaled = true;

    debug?.("sending answer", localCandidate, answer);

    await signalSend(key + "_answer", {
      candidate: localCandidate,
      answer,
    });

    debug?.("answer sent");
  };

  peerConnection.addEventListener("icecandidate", (event) => {
    if (!event.candidate) return;

    debug?.("local candidate ready");

    localCandidate = event.candidate;

    after();
  });

  debug?.("fetching offer");

  signalGet(key + "_offer").then(async ({ offer, candidate }) => {
    debug?.("offer fetched");

    debug?.("setting remote description");

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    debug?.("setting remote ice candidate");

    await peerConnection.addIceCandidate(candidate);

    debug?.("creating answer");

    answer = await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(answer);

    after();
  });

  let resolveDataChannel: (c: RTCDataChannel) => void;
  const dataChannelPromise = new Promise<RTCDataChannel>(
    (r) => (resolveDataChannel = r)
  );

  peerConnection.addEventListener("datachannel", (event) =>
    resolveDataChannel(event.channel)
  );

  return {
    peerConnection,
    getDataChannel: () => dataChannelPromise,
    close: () => {
      peerConnection.close();
    },
  };
};
