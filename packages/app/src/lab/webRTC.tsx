const rtcConfiguration: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.mystunserver.tld" }],
};

export const host = (key: string) => {
  const peerConnection = new RTCPeerConnection(rtcConfiguration);

  peerConnection.addEventListener("connectionstatechange", () => {
    console.log("connection status", peerConnection.connectionState);
  });

  let offer: RTCSessionDescriptionInit;
  let localCandidate: RTCIceCandidate;
  let signaled = false;

  const after = async () => {
    if (signaled) return;

    if (!localCandidate) return;

    if (!offer) return;

    signaled = true;

    await signalSend(key + "_offer", {
      candidate: localCandidate,
      offer,
    });
  };

  peerConnection.addEventListener("icecandidate", (event) => {
    if (!event.candidate) return;

    localCandidate = event.candidate;

    after();
  });

  peerConnection.addEventListener("negotiationneeded", async (event) => {
    offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    after();
  });

  signalListen(key + "_answer").then(async ({ answer, candidate }) => {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer)
    );

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

export const join = (key: string) => {
  const peerConnection = new RTCPeerConnection(rtcConfiguration);

  peerConnection.addEventListener("connectionstatechange", () => {
    console.log("connection status", peerConnection.connectionState);
  });

  let localCandidate: RTCIceCandidate;
  let answer: RTCLocalSessionDescriptionInit;
  let signaled = false;

  const after = async () => {
    if (signaled) return;

    if (!localCandidate) return;

    signaled = true;

    await signalSend(key + "_answer", {
      candidate: localCandidate,
      answer,
    });
  };

  peerConnection.addEventListener("icecandidate", (event) => {
    if (!event.candidate) return;

    localCandidate = event.candidate;

    after();
  });

  signalGet(key + "_offer").then(async ({ offer, candidate }) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    await peerConnection.addIceCandidate(candidate);

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

const STORE_URL = "https://bong-bong--webrtc-signal.platane.workers.dev";

const signalGet = async (key: string) => {
  const res = await fetch(STORE_URL + "/blob/" + key, {
    method: "GET",
  });

  if (res.ok) return res.json();

  if (res.status !== 404) throw await res.text().catch(() => res.statusText);

  return null;
};

const signalListen = async (
  key: string,
  { pollingDuration = 2000 }: { pollingDuration?: number } = {}
) => {
  while (true) {
    const value = await signalGet(key);

    if (value) return value;

    await new Promise((r) => setTimeout(r, pollingDuration));
  }
};

const signalSend = (key: string, data: any) =>
  fetch(STORE_URL + "/blob/" + key, {
    body: JSON.stringify(data, null, 2),
    method: "PUT",
  }).then((res) => {
    if (!res.ok) return res.text().catch(() => res.statusText);
  });
