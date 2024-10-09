import * as React from "react";
import QRCode from "react-qr-code";

export const WebRTC = () => {
  const [joinKey] = React.useState(() => window.location.hash.slice(1) || null);

  const [hostKey] = React.useState(generateId);

  return (
    <>
      <h1>WebRTC</h1>

      {joinKey && <Guest roomKey={joinKey} />}
      {!joinKey && <Host roomKey={hostKey} />}
    </>
  );
};

const Host = ({ roomKey }: { roomKey: string }) => {
  const joinUrl = window.origin + import.meta.env.BASE_URL + "#" + roomKey;

  const [{ getDataChannel }] = React.useState(() => host(roomKey));

  const [messages, addMessage] = React.useReducer(
    (messages: string[], message: string) => [...messages, message],
    []
  );

  React.useEffect(() => {
    getDataChannel().then((dataChannel) => {
      dataChannel.addEventListener("open", async (event) => {
        addMessage("open");

        while (true) {
          dataChannel.send(
            JSON.stringify({ timestamp: Date.now(), content: "yolo" })
          );

          await wait(1500);
        }
      });

      dataChannel.addEventListener("message", (event) => {
        const { timestamp, content } = JSON.parse(event.data);
        addMessage(`${content} [${Date.now() - timestamp}ms]  `);
      });
    });
  }, []);

  return (
    <>
      <h2>Host</h2>
      <QRCode value={joinUrl} />
      <a target="_blank" href={joinUrl}>
        join
      </a>

      <pre>{messages.join("\n")}</pre>
    </>
  );
};

const Guest = ({ roomKey }: { roomKey: string }) => {
  const [{ getDataChannel }] = React.useState(() => join(roomKey));

  const [messages, addMessage] = React.useReducer(
    (messages: string[], message: string) => [...messages, message],
    []
  );

  React.useEffect(() => {
    getDataChannel().then((dataChannel) => {
      dataChannel.addEventListener("open", async (event) => {
        addMessage("open");

        while (true) {
          dataChannel.send(
            JSON.stringify({ timestamp: Date.now(), content: "yolo" })
          );

          await wait(1500);
        }
      });

      dataChannel.addEventListener("message", (event) => {
        const { timestamp, content } = JSON.parse(event.data);
        addMessage(`${content} [${Date.now() - timestamp}ms]  `);
      });
    });
  }, []);

  return (
    <>
      <h2>Guest</h2>

      <pre>{messages.join("\n")}</pre>
    </>
  );
};

const rtcConfiguration: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.mystunserver.tld" }],
};

const host = (key: string) => {
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

const join = (key: string) => {
  const peerConnection = new RTCPeerConnection(rtcConfiguration);

  peerConnection.addEventListener("connectionstatechange", () => {
    console.log("connection status", peerConnection.connectionState);
  });

  let localCandidate: RTCIceCandidate;
  let remoteCandidate: RTCIceCandidate;
  let answer: RTCLocalSessionDescriptionInit;
  let signaled = false;

  const after = async () => {
    if (signaled) return;

    if (!localCandidate) return;

    if (!remoteCandidate) return;

    signaled = true;

    await peerConnection.addIceCandidate(remoteCandidate);

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
    remoteCandidate = candidate;

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

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

const useAsyncMemo = <T, D>(
  h: (signal: AbortSignal) => Promise<T>,
  deps: D[]
) => {
  const r = React.useRef({
    deps: [Symbol() as D],
    abortController: new AbortController(),
    value: null as T | null,
    error: null as Error | null,
  });
  const [, refresh] = React.useReducer((x = 1) => 1 + x, 1);

  if (arrayEquals(r.current.deps, deps)) {
    const abortController = new AbortController();

    if (r.current.value === null) r.current.abortController.abort();

    r.current.deps = deps;
    r.current.abortController = abortController;
    r.current.error = null;
    r.current.value = null;

    const promise = h(abortController.signal)
      .then((value) => {
        r.current.value = value;
        refresh();
      })
      .catch((err) => {
        r.current.error = err;
        refresh();
      });
  }

  if (r.current.error) throw r.current.error;

  return r.current.value;
};

const arrayEquals = <T,>(a: T[], b: T[]) =>
  a.length === b.length && a.every((_, i) => a[i] === b[i]);

const generateId = () =>
  Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

const wait = (delay = 0) => new Promise((r) => setTimeout(r, delay));

const signalGet = async (key: string) => {
  const res = await fetch("http://localhost:3000/blob/" + key, {
    method: "GET",
  });

  if (res.ok) return res.json();

  if (res.status !== 404) throw await res.text().catch(() => res.statusText);

  return null;
};

const signalListen = async (key: string) => {
  while (true) {
    const value = await signalGet(key);

    if (value) return value;

    await wait(5000);
  }
};

const signalSend = (key: string, data: any) =>
  fetch("http://localhost:3000/blob/" + key, {
    body: JSON.stringify(data, null, 2),
    method: "PUT",
  }).then((res) => {
    if (!res.ok) return res.text().catch(() => res.statusText);
  });
