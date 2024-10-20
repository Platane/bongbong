import { rtcConfiguration } from "./webRTC.configuration";

export type SignalMessage =
  | { type: "host-offer"; offer: RTCSessionDescriptionInit }
  | { type: "host-candidate"; candidate: RTCIceCandidate }
  | { type: "guest-answer"; answer: RTCSessionDescriptionInit }
  | { type: "guest-candidate"; candidate: RTCIceCandidate };

export type SignalingChannel = {
  broadcast: (m: SignalMessage) => Promise<void>;
  subscribe: (h: (m: SignalMessage) => void) => () => void;
};

export type Pipe = {
  send: RTCDataChannel["send"];
  dispose: () => void;
  getStatus?: () => "connected" | "closed" | "connecting";
  readyPromise: Promise<void>;
  errorPromise: Promise<void>;
  subscribeToMessage: (h: (data: any) => void) => () => void;
};

export const host = (signalingChannel: SignalingChannel) => {
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
  dataChannel.addEventListener("error", (event) => {
    reportError();
  });

  peerConnection.addEventListener("icecandidateerror", (event) => {
    console.debug("icecandidateerror", event.errorText);
  });
  peerConnection.addEventListener("connectionstatechange", () => {
    console.debug("connectionstatechange", peerConnection.connectionState);

    if (
      peerConnection.connectionState === "closed" ||
      peerConnection.connectionState === "disconnected" ||
      peerConnection.connectionState === "failed"
    ) {
      reportError();
    }
  });

  // attach ready event
  dataChannel.addEventListener("open", () => resolveReady());

  // broadcast ice candidate
  peerConnection.addEventListener("icecandidate", async ({ candidate }) => {
    if (!candidate) return;

    signalingChannel
      .broadcast({ type: "host-candidate", candidate })
      .catch(reportError);
  });

  // broadcast offer
  peerConnection
    .createOffer()
    .then(async (offer) => {
      await peerConnection.setLocalDescription(offer);

      await signalingChannel.broadcast({ type: "host-offer", offer });
    })
    .catch((err) => reportError(err));

  // hold remote ice candidate while the answer arrives
  const remoteIceCandidates = new Set<RTCIceCandidate>();

  // handle message, one by one
  const messageFile: SignalMessage[] = [];
  let handlingMessage = false;
  const handleMessage = async () => {
    if (handlingMessage) return;

    try {
      handlingMessage = true;

      const message = messageFile.shift();

      if (!message) return;

      if (message.type === "guest-candidate") {
        if (peerConnection.remoteDescription)
          await peerConnection.addIceCandidate(message.candidate);
        else remoteIceCandidates.add(message.candidate);
      }

      if (
        message.type === "guest-answer" &&
        !peerConnection.remoteDescription
      ) {
        const answer = new RTCSessionDescription(message.answer);
        await peerConnection.setRemoteDescription(answer);

        for (const candidate of remoteIceCandidates)
          await peerConnection.addIceCandidate(candidate);
      }
    } catch (err) {
      reportError(err);
    } finally {
      handlingMessage = false;
    }

    handleMessage();
  };

  // listen to signaling server
  const unsubscribe = signalingChannel.subscribe((message) => {
    messageFile.push(message);
    handleMessage();
  });

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
  } satisfies Pipe;
};

export const join = (signalingChannel: SignalingChannel): Pipe => {
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
    console.debug("connectionstatechange", peerConnection.connectionState);

    if (
      peerConnection.connectionState === "closed" ||
      peerConnection.connectionState === "disconnected" ||
      peerConnection.connectionState === "failed"
    ) {
      reportError();
    }

    if (
      peerConnection.connectionState === "connected" ||
      peerConnection.connectionState === "connecting"
    )
      clearTimeout(timeout);
  });

  // broadcast ice candidate
  peerConnection.addEventListener("icecandidate", async ({ candidate }) => {
    if (!candidate) return;

    signalingChannel
      .broadcast({ type: "guest-candidate", candidate })
      .catch(reportError);
  });

  // hold remote ice candidate while the answer arrives
  const remoteIceCandidates = new Set<RTCIceCandidate>();

  let unwrittenAnswer: RTCLocalSessionDescriptionInit | undefined;

  // handle message, one by one
  const messageFile: SignalMessage[] = [];
  let handlingMessage = false;
  const handleMessage = async () => {
    if (handlingMessage) return;

    try {
      handlingMessage = true;

      const message = messageFile.shift();

      if (!message) return;

      if (message.type === "host-candidate") {
        if (peerConnection.remoteDescription)
          await peerConnection.addIceCandidate(message.candidate);
        else remoteIceCandidates.add(message.candidate);
      }

      if (message.type === "guest-answer" && unwrittenAnswer) {
        if (JSON.stringify(message.answer) === JSON.stringify(unwrittenAnswer))
          unwrittenAnswer = undefined;
        else throw new Error("offer answered by another guest");
      }

      if (message.type === "host-offer" && !peerConnection.remoteDescription) {
        const offer = new RTCSessionDescription(message.offer);
        await peerConnection.setRemoteDescription(offer);

        for (const candidate of remoteIceCandidates)
          await peerConnection.addIceCandidate(candidate);

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        unwrittenAnswer = answer;

        signalingChannel
          .broadcast({ type: "guest-answer", answer })
          .catch(reportError);

        timeout = setTimeout(
          () =>
            reportError(
              new Error("timeout while waiting for host to accept answer")
            ),
          8 * 1000
        );
      }
    } catch (err) {
      reportError(err);
    } finally {
      handlingMessage = false;
    }

    handleMessage();
  };

  // listen to signaling server
  const unsubscribe = signalingChannel.subscribe((message) => {
    messageFile.push(message);
    handleMessage();
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
