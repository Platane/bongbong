import QRCode from "qrcode";
import { signalBroadcast, signalListen } from "@bongbong/webRTC/signal";

///
/// some html elements

const logElement = document.getElementById("log")!;
const print = (...args: any[]) =>
  (logElement.innerText += args.join(" ") + "\n");
const rootElement = document.getElementById("root")!;

const renderGuest = (roomKey: string) => {
  const h1Element = document.createElement("h1");

  h1Element.innerText = "Guest room " + roomKey;

  rootElement.appendChild(h1Element);
};
const renderHost = (roomKey: string) => {
  const h1Element = document.createElement("h1");
  h1Element.innerText = "Host room " + roomKey;

  const joinUrl = window.origin + import.meta.env.BASE_URL + "#" + roomKey;

  const qrCodeImageElement = document.createElement("img");
  qrCodeImageElement.width = 256;
  qrCodeImageElement.height = 256;
  qrCodeImageElement.style.imageRendering = "pixelated";
  QRCode.toDataURL(joinUrl, { margin: 0, width: 256 }, (error, url) => {
    qrCodeImageElement.src = url;
  });

  const anchorElement = document.createElement("a");
  anchorElement.href = joinUrl;
  anchorElement.innerText = "join room url";
  anchorElement.target = "_blank";

  const copyButtonElement = document.createElement("button");
  copyButtonElement.onclick = () => navigator.clipboard.writeText(joinUrl);
  copyButtonElement.innerText = "copy";

  rootElement.appendChild(h1Element);
  rootElement.appendChild(qrCodeImageElement);
  rootElement.appendChild(anchorElement);
  rootElement.appendChild(copyButtonElement);
};

console.log = (...args) => print("[log]", ...args);

//
//

const initializeDataChannel = (dataChannel: RTCDataChannel) => {
  dataChannel.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case "ping":
        return dataChannel.send(JSON.stringify({ ...data, type: "pong" }));
      case "pong":
        return print(
          "ping round-trip: " + (Date.now() - data.timestamp) + "ms"
        );
    }
  });

  setInterval(
    () =>
      dataChannel.send(JSON.stringify({ timestamp: Date.now(), type: "ping" })),
    5000
  );
};

const joinKey = window.location.hash.slice(1);

const rtcConfiguration: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.mystunserver.tld" }],
};

type SignalMessage =
  | { type: "host-offer"; offer: RTCSessionDescriptionInit }
  | { type: "host-candidate"; candidate: RTCIceCandidate }
  | { type: "guest-answer"; answer: RTCSessionDescriptionInit }
  | { type: "guest-candidate"; candidate: RTCIceCandidate };

if (!joinKey) {
  //
  //
  // host mode
  //
  //

  const roomKey = Math.random().toString(36).slice(2);

  renderHost(roomKey);

  //

  // very hacky way to mitigate race condition on first write
  signalBroadcast(roomKey, {});

  const peerConnection = new RTCPeerConnection(rtcConfiguration);

  peerConnection.addEventListener("connectionstatechange", () =>
    console.log("peerConnection status:", peerConnection.connectionState)
  );

  peerConnection.addEventListener("icecandidate", async ({ candidate }) => {
    if (!candidate) return;

    console.log("found local ice candidate, broadcasting it...", candidate);

    signalBroadcast<SignalMessage>(roomKey, {
      type: "host-candidate",
      candidate,
    });
  });

  const dataChannel = peerConnection.createDataChannel("Data Channel");

  dataChannel.addEventListener("close", () => console.log("dataChannel close"));
  dataChannel.addEventListener("error", () => console.log("dataChannel error"));

  if (dataChannel.readyState === "open") initializeDataChannel(dataChannel);
  else {
    dataChannel.addEventListener("open", () =>
      initializeDataChannel(dataChannel)
    );
  }

  // listen to message from the signaling server
  // store the message to allow to replay
  const messages: SignalMessage[] = [];
  const onMessage = async (message: SignalMessage) => {
    if (message.type === "guest-answer") {
      if (peerConnection.remoteDescription) return;

      console.log(
        "got an answer, setting as remote description",
        message.answer
      );

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(message.answer)
      );

      // replaying messages
      for (const m of messages) await onMessage(m);
    }

    if (message.type === "guest-candidate") {
      if (!peerConnection.remoteDescription) return;

      console.log("got ice candidate for the host, adding it...");

      await peerConnection.addIceCandidate(message.candidate);
    }
  };
  signalListen<SignalMessage>(roomKey, async (ms) => {
    messages.push(...ms);
    for (const m of ms) await onMessage(m);
  });

  // creating offer
  (async () => {
    console.log(
      "creating offer, setting as local description and broadcasting it"
    );
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    await signalBroadcast<SignalMessage>(roomKey, {
      type: "host-offer",
      offer,
    });
  })();
}

if (joinKey) {
  //
  //
  // guest mode
  //
  //

  const roomKey = joinKey;

  renderGuest(roomKey);

  //

  const peerConnection = new RTCPeerConnection(rtcConfiguration);

  peerConnection.addEventListener("connectionstatechange", () =>
    console.log("peerConnection status:", peerConnection.connectionState)
  );

  peerConnection.addEventListener("icecandidate", async ({ candidate }) => {
    if (!candidate) return;

    console.log("found local ice candidate, broadcasting it...", candidate);

    signalBroadcast<SignalMessage>(roomKey, {
      type: "guest-candidate",
      candidate,
    });
  });

  peerConnection.addEventListener("datachannel", (event) => {
    const dataChannel = event.channel;
    console.log("found a data channel", dataChannel, dataChannel.readyState);

    dataChannel.addEventListener("close", () =>
      console.log("dataChannel close")
    );
    dataChannel.addEventListener("error", () =>
      console.log("dataChannel error")
    );

    if (dataChannel.readyState === "open") initializeDataChannel(dataChannel);
    else {
      dataChannel.addEventListener("open", () =>
        initializeDataChannel(dataChannel)
      );
    }
  });

  // listen to message from the signaling server
  // store the message to allow to replay
  const messages: SignalMessage[] = [];
  const onMessage = async (message: SignalMessage) => {
    if (message.type === "host-offer") {
      if (peerConnection.remoteDescription) return;

      console.log("got an offer, setting as remote description", message.offer);

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(message.offer)
      );

      console.log("creating an answer and setting it as local description");

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      console.log("broadcasting the answer");

      await signalBroadcast<SignalMessage>(roomKey, {
        type: "guest-answer",
        answer,
      });

      // replaying messages
      for (const m of messages) await onMessage(m);
    }

    if (message.type === "host-candidate") {
      if (!peerConnection.remoteDescription) return;

      console.log("got ice candidate for the host, adding it...");

      await peerConnection.addIceCandidate(message.candidate);
    }
  };
  signalListen<SignalMessage>(roomKey, async (ms) => {
    messages.push(...ms);
    for (const m of ms) await onMessage(m);
  });
}
