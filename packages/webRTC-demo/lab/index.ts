import QRCode from "qrcode";
import { host, join, Pipe } from "@bongbong/webRTC/webRTC-utils";

///
/// some html elements

const logElement = document.getElementById("log")!;
const print = (...args: any[]) =>
  (logElement.innerText += args.join(", ") + "\n");
const rootElement = document.getElementById("root")!;

///
/// create pipe

let pipe: Pipe | undefined;

const joinKey = window.location.hash.slice(1);

if (joinKey) {
  const roomKey = joinKey;

  {
    const h1Element = document.createElement("h1");
    h1Element.innerText = "Guest room " + roomKey;

    rootElement.appendChild(h1Element);
  }

  pipe = join(roomKey, new Set());
}

if (!joinKey) {
  const roomKey = Math.random().toString(36).slice(2);

  {
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
  }

  pipe = host(roomKey);
}

pipe?.subscribeToMessage((_data) => {
  const data = JSON.parse(_data);

  switch (data.type) {
    case "ping":
      return pipe.send(JSON.stringify({ ...data, type: "pong" }));
    case "pong":
      return print("ping round-trip: " + (Date.now() - data.timestamp) + "ms");
  }
});

pipe?.readyPromise.then(async () => {
  while (true) {
    pipe.send(JSON.stringify({ timestamp: Date.now(), type: "ping" }));

    const wait = (delay = 0) => new Promise((r) => setTimeout(r, delay));

    await wait(1500);
  }
});

pipe?.errorPromise.catch((err) => console.error("pipe error", err));
