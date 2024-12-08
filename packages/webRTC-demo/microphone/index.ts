import QRCode from "qrcode";

///
/// some html elements

const logElement = document.getElementById("log")!;
const print = (...args: any[]) =>
  (logElement.innerText += args.join(" ") + "\n");
const rootElement = document.getElementById("root")!;

const originalConsoleLog = console.log;
console.log = (...args) => {
  print("[log]", ...args);
  originalConsoleLog.call(console, ...args);
};

const createCurveChart = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 600;

  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;

  const update = (dataArray: Uint8Array) => {
    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    for (let i = 0; i < dataArray.length; i++) {
      ctx.lineTo(
        (i / dataArray.length) * width,
        (dataArray[i] / 128.0) * (height / 2)
      );
    }
    ctx.stroke();
  };

  return { canvas, update };
};

const createBarChart = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 600;

  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;

  const margin = 0.1;

  const update = (dataArray: Uint8Array) => {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < dataArray.length; i++) {
      ctx.fillRect(
        (i / dataArray.length) * width,
        height,
        (width / dataArray.length) * (1 - margin),
        -(dataArray[i] / 256) * height
      );
    }
  };

  return { canvas, update };
};

const timeCurve = createCurveChart();
const fftCurve = createBarChart();
rootElement.appendChild(timeCurve.canvas);
rootElement.appendChild(fftCurve.canvas);

(async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
    console.log("unsupported");

  console.log("checking microphone permission...");

  const status = await navigator.permissions.query({
    name: "microphone" as any,
  });
  console.log("microphone permission:", status.state);

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  console.log("got stream");

  const audioContext = new AudioContext();

  const source = audioContext.createMediaStreamSource(stream);

  // const out = audioContext.createMediaStreamDestination();

  // const mediaRecorder = new MediaRecorder(out.stream, {
  //   mimeType: "video/webm; codecs=vp9",
  // });
  // mediaRecorder.addEventListener("dataavailable", () => console.log("ok"));
  // mediaRecorder.start();

  // playback
  {
    const delay = audioContext.createDelay(1);
    delay.delayTime.value = 0.5;
    source.connect(delay);
    delay.connect(audioContext.destination);
  }

  {
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    const loop = () => {
      analyser.getByteFrequencyData(dataArray);
      fftCurve.update(dataArray);

      analyser.getByteTimeDomainData(dataArray);
      timeCurve.update(dataArray);

      requestAnimationFrame(loop);
    };
    loop();
  }

  //
})().catch((err) => console.log("error", err));
