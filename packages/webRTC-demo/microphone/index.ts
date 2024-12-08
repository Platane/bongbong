import QRCode from "qrcode";

// @ts-ignore
import example_src from "./input.mp3?url";

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
  canvas.style.width = `min( ${canvas.width}px , 100% - 16px )`;

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
  canvas.style.width = `min( ${canvas.width}px , 100% - 16px )`;

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

  // const source = audioContext.createMediaStreamSource(stream);

  // play the example
  const audio = new Audio();
  audio.src = example_src;
  audio.loop = true;
  audio.crossOrigin = "anonymous";
  audio.play();
  const source = audioContext.createMediaElementSource(audio);

  {
    const out = audioContext.createMediaStreamDestination();
    const mediaRecorder = new MediaRecorder(out.stream, {
      mimeType: "video/webm; codecs=vp9",
    });

    const recordedChunks: BlobPart[] = [];

    mediaRecorder.addEventListener("dataavailable", (e) => {
      recordedChunks.push(e.data);
    });
    mediaRecorder.addEventListener("stop", () => {
      console.log("recording over");

      const blob = new Blob(recordedChunks, {
        type: "video/webm",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "test.webm";
      a.click();
      window.URL.revokeObjectURL(url);
    });

    source.connect(out);

    //

    const button = document.createElement("button");
    button.innerText = "record";
    rootElement.appendChild(button);
    button.addEventListener("click", () => {
      button.disabled = true;

      mediaRecorder.start();

      const startTime = audioContext.currentTime;

      const loop = () => {
        const duration = audioContext.currentTime - startTime;
        const maxDuration = 5;

        if (duration > maxDuration) {
          mediaRecorder.stop();

          button.innerText = "done";
        } else {
          const k = Math.floor((1 - duration / maxDuration) * 16);

          button.innerText = `recording ${".".repeat(k)}`;

          requestAnimationFrame(loop);
        }
      };
      loop();
    });
  }

  // playback
  {
    // const delay = audioContext.createDelay(1);
    // delay.delayTime.value = 0.5;
    // source.connect(delay);
    // delay.connect(audioContext.destination);
  }

  source.connect(audioContext.destination);

  {
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048 * 16;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    console.log("window duration", bufferLength / audioContext.sampleRate);

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
