import QRCode from "qrcode";
import { createGuest, createHost } from "@bongbong/webRTC/multi-guest";

///
/// some html elements

const logElement = document.getElementById("log")!;
const print = (...args: any[]) =>
  (logElement.innerText += args.join(" ") + "\n");
const rootElement = document.getElementById("root")!;

const readmeElement = document.createElement("pre");
readmeElement.innerText = "";
rootElement.appendChild(readmeElement);

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
  qrCodeImageElement.style.display = "block";
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

const joinKey = window.location.hash.slice(1);

if (!joinKey) {
  const roomKey = Math.random().toString(36).slice(2);

  renderHost(roomKey);

  const host = createHost(roomKey);

  console.log("list of guests: [" + host.getGuests().join(", ") + "]");
  host.subscribeToGuestChange(() => {
    console.log("list of guests: [" + host.getGuests().join(", ") + "]");
  });

  setInterval(() => {
    host.broadcast({ timestamp: Date.now(), type: "ping" });
  }, 5000);

  host.subscribeToMessage((data) => {
    switch (data.type) {
      case "ping":
        return host.send(data.sender, { ...data, type: "pong" });
      case "pong":
        return print(
          "ping round-trip to guest " +
            data.sender +
            ": " +
            (Date.now() - data.timestamp) +
            "ms"
        );
    }
  });
}

if (joinKey) {
  renderGuest(joinKey);

  const guest = createGuest(joinKey);

  console.log("status: " + guest.getStatus());
  guest.subscribeToStatusChange(() => {
    console.log("status: " + guest.getStatus());
  });

  setInterval(() => {
    if (guest.getStatus() === "connected")
      guest.send({ timestamp: Date.now(), type: "ping" });
  }, 5000);

  guest.subscribeToMessage((data) => {
    switch (data.type) {
      case "ping":
        return guest.send({ ...data, type: "pong" });
      case "pong":
        return print(
          "ping round-trip: " + (Date.now() - data.timestamp) + "ms"
        );
    }
  });
}
