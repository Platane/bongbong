import QRCode from "qrcode";
import { host, join } from "../webRTC/webRTC-utils";

const logElement = document.getElementById("log")!;
const print = (...args: any[]) =>
  (logElement.innerText += args.join(", ") + "\n");
const rootElement = document.getElementById("root")!;

(async () => {
  const joinKey = window.location.hash.slice(1);

  let dataChannelPromise: Promise<RTCDataChannel> | undefined;

  if (joinKey) {
    const roomKey = joinKey;

    {
      const h1Element = document.createElement("h1");
      h1Element.innerText = "Guest room " + roomKey;

      rootElement.appendChild(h1Element);
    }

    dataChannelPromise = join(roomKey, {
      debug: (...a) => print("[debug]", ...a),
    }).dataChannelPromise;
  }

  if (!joinKey) {
    const roomKey = Math.random().toString(36).slice(2);

    {
      const h1Element = document.createElement("h1");
      h1Element.innerText = "Host room " + roomKey;

      rootElement.appendChild(h1Element);
    }

    {
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
      copyButtonElement.onclick = () => {
        if (window.navigator?.clipboard?.writeText)
          navigator.clipboard.writeText(joinUrl);

        if (document.execCommand) {
          const copyText = document.createElement("textarea");
          copyText.innerText = joinUrl;
          copyText.select();

          document.execCommand("copy");
        }
      };
      copyButtonElement.innerText = "copy";

      rootElement.appendChild(qrCodeImageElement);
      rootElement.appendChild(anchorElement);
      rootElement.appendChild(copyButtonElement);
    }

    dataChannelPromise = host(roomKey, {
      debug: (...a) => print("[debug]", ...a),
    }).dataChannelPromise;
  }

  dataChannelPromise?.then(async (dataChannel) => {
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

    dataChannel.addEventListener("error", () => console.log("channel error"));
    dataChannel.addEventListener("close", () => console.log("channel closed"));

    while (true) {
      dataChannel.send(JSON.stringify({ timestamp: Date.now(), type: "ping" }));

      await wait(1500);
    }
  });
})();

const wait = (delay = 0) => new Promise((r) => setTimeout(r, delay));
