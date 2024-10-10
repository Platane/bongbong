import * as React from "react";
import QRCode from "react-qr-code";
import { host, join } from "./webRTC";

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

  const [messages, addMessage] = React.useReducer(
    (messages: string[], message: string) => [...messages, message],
    []
  );

  const [{ getDataChannel }] = React.useState(() =>
    host(roomKey, {
      debug: (...args) => addMessage("[debug] " + args.join(", ")),
    })
  );

  React.useEffect(() => {
    getDataChannel().then((dataChannel) => {
      dataChannel.addEventListener("open", async () => {
        addMessage("open");

        while (true) {
          dataChannel.send(
            JSON.stringify({ timestamp: Date.now(), type: "ping" })
          );

          await wait(1500);
        }
      });

      dataChannel.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "ping":
            return dataChannel.send(JSON.stringify({ ...data, type: "pong" }));
          case "pong":
            return addMessage(
              "ping round-trip: " + (Date.now() - data.timestamp) + "ms"
            );
        }
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
  const [messages, addMessage] = React.useReducer(
    (messages: string[], message: string) => [...messages, message],
    []
  );

  const [{ getDataChannel }] = React.useState(() =>
    join(roomKey, {
      debug: (...args) => addMessage("[debug] " + args.join(", ")),
    })
  );

  React.useEffect(() => {
    getDataChannel().then((dataChannel) => {
      dataChannel.addEventListener("open", async () => {
        addMessage("open");

        while (true) {
          dataChannel.send(
            JSON.stringify({ timestamp: Date.now(), type: "ping" })
          );

          await wait(1500);
        }
      });

      dataChannel.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "ping":
            return dataChannel.send(JSON.stringify({ ...data, type: "pong" }));
          case "pong":
            return addMessage(
              "ping round-trip: " + (Date.now() - data.timestamp) + "ms"
            );
        }
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

const generateId = () =>
  Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

const wait = (delay = 0) => new Promise((r) => setTimeout(r, delay));
