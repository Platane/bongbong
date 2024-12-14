import Webfft from "webfft";

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
  canvas.height = 400;
  canvas.style.width = `min( ${canvas.width}px , 100% - 16px )`;

  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;

  const update = (dataArray: Float32Array) => {
    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    for (let i = 0; i < dataArray.length; i++) {
      ctx.lineTo(
        (i / dataArray.length) * width,
        (dataArray[i] + 1) * (height / 2)
      );
    }
    ctx.stroke();
  };

  return { canvas, ctx, update };
};

const createBarChart = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 400;
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

  return { canvas, ctx, update };
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
  audio.loop = !true;
  audio.crossOrigin = "anonymous";
  audio.play();
  const source = audioContext.createMediaElementSource(audio);

  const createRecorder = (source: AudioNode) => {
    const out = audioContext.createMediaStreamDestination();
    const mimeType = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "video/webm;codecs=vp8",
      "video/webm;codecs=daala",
      "video/webm;codecs=h264",
      "video/webm",
      "video/mp4",
    ].find((t) => MediaRecorder.isTypeSupported(t));
    const mediaRecorder = new MediaRecorder(out.stream, { mimeType });

    const recordedChunks: BlobPart[] = [];

    mediaRecorder.addEventListener("dataavailable", (e) => {
      recordedChunks.push(e.data);
    });
    mediaRecorder.addEventListener("stop", () => {
      const blob = new Blob(recordedChunks, { type: mimeType });
      resolveBlob(blob);
    });

    source.connect(out);

    let resolveBlob: (value: Blob) => void;
    const blobPromise = new Promise<Blob>((r) => {
      resolveBlob = r;
    });

    return {
      start: () => mediaRecorder.start(),
      stop: () => {
        // mediaRecorder.requestData();
        mediaRecorder.stop();
      },
      getBlob: () => blobPromise,
    };
  };

  {
    //

    const button = document.createElement("button");
    button.innerText = "record";
    rootElement.appendChild(button);
    button.addEventListener("click", () => {
      button.disabled = true;

      const recorder = createRecorder(source);
      recorder.getBlob().then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "test.webm";
        a.click();
        window.URL.revokeObjectURL(url);
      });

      const startTime = audioContext.currentTime;
      recorder.start();

      const loop = () => {
        const duration = audioContext.currentTime - startTime;
        const maxDuration = 5;

        if (duration > maxDuration) {
          recorder.stop();

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
    analyser.fftSize = 2048 * 4;
    const bufferLength = analyser.frequencyBinCount;
    const dataArrayFloat = new Float32Array(bufferLength);
    const dataArrayUint = new Uint8Array(bufferLength);

    console.log(
      "window duration",
      bufferLength / audioContext.sampleRate,
      analyser.frequencyBinCount
    );

    // const buffer = audioContext.createBuffer(
    //   source.channelCount,
    //   0.5,
    //   audioContext.sampleRate
    // );

    source.connect(analyser);

    let average = 0.1;

    const hits = [] as {
      startDate: number;
      endDate: number;
      data: Float32Array;
    }[];

    const hitContainer = document.createElement("div");
    hitContainer.style.display = "flex";
    hitContainer.style.flexDirection = "row";
    hitContainer.style.flexWrap = "wrap";
    hitContainer.style.gap = "16px";
    rootElement.appendChild(hitContainer);

    const addHit = (startDate: number, endDate: number, data: Float32Array) => {
      hits.push({ startDate, endDate, data });

      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.flexDirection = "column";
      div.style.width = "260px";

      {
        const canvas = document.createElement("canvas");
        canvas.width = 240;
        canvas.style.border = "solid 1px #888";
        canvas.height = 200;
        const ctx = canvas.getContext("2d")!;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        for (let i = 0; i < data.length; i++) {
          ctx.lineTo(
            (i / data.length) * canvas.width,
            (data[i] + 1) * (canvas.height / 2)
          );
        }
        ctx.stroke();

        div.appendChild(canvas);
      }

      {
        const inputSize = 2 ** Math.ceil(Math.log(data.length) / Math.LN2);

        const input0pad = new Float32Array(inputSize);
        input0pad.fill(0);
        input0pad.set(data, 0);

        const fftsize = input0pad.length / 2;
        const fft = new Webfft(fftsize);
        const out = fft.fft(input0pad);

        const canvas = document.createElement("canvas");
        canvas.width = 260;
        canvas.height = 200;
        const ctx = canvas.getContext("2d")!;
        ctx.beginPath();
        for (let i = 0; i < out.length; i++) {
          ctx.fillRect(
            (i / out.length) * canvas.width,
            canvas.height,
            (1 / out.length) * canvas.width * 0.5,
            -out[i] * canvas.height * 0.02
          );
        }

        div.appendChild(canvas);

        // fft.dispose()
      }

      {
        const audio = document.createElement("audio");
        audio.style.width = "100%";
        audio.controls = true;
        audio.loop = false;

        const buffer = audioContext.createBuffer(
          1,
          data.length,
          audioContext.sampleRate
        );

        const bufferContent = buffer.getChannelData(0);
        bufferContent.set(data, 0);

        const bufferSource = audioContext.createBufferSource();
        bufferSource.buffer = buffer;

        const recorder = createRecorder(bufferSource);
        recorder.start();
        bufferSource.start();

        bufferSource.onended = () => {
          setTimeout(() => recorder.stop(), 10);
        };

        recorder.getBlob().then((blob) => {
          audio.src = URL.createObjectURL(blob);

          // workaround to fix the audio duration
          // ref: https://stackoverflow.com/questions/38443084/how-can-i-add-predefined-length-to-audio-recorded-from-mediarecorder-in-chrome
          audio.onloadedmetadata = () => {
            audio.currentTime = Number.MAX_SAFE_INTEGER;
          };
        });

        div.appendChild(audio);
      }

      hitContainer.appendChild(div);
    };

    const loop = () => {
      analyser.getByteFrequencyData(dataArrayUint);
      fftCurve.update(dataArrayUint);

      analyser.getFloatTimeDomainData(dataArrayFloat);
      timeCurve.update(dataArrayFloat);

      const instantAverage =
        dataArrayFloat.reduce((sum, x) => sum + x ** 2) / dataArrayFloat.length;

      average = 0.9 * average + instantAverage * 0.1;

      {
        timeCurve.ctx.save();
        timeCurve.ctx.strokeStyle = "red";
        timeCurve.ctx.beginPath();
        timeCurve.ctx.moveTo(
          0,
          (average * 0.5 + 0.5) * timeCurve.canvas.height
        );
        timeCurve.ctx.lineTo(
          timeCurve.canvas.width,
          (average * 0.5 + 0.5) * timeCurve.canvas.height
        );
        timeCurve.ctx.stroke();
        timeCurve.ctx.restore();
      }

      const WINDOW_SIZE_SECOND = 0.06;

      for (
        let i = 0;
        i <
        dataArrayFloat.length -
          Math.floor(audioContext.sampleRate * WINDOW_SIZE_SECOND);
        i++
      ) {
        const t =
          audioContext.currentTime -
          (dataArrayFloat.length - i) / audioContext.sampleRate;

        if (hits.some((h) => h.startDate <= t && t <= h.endDate)) continue;

        const v = dataArrayFloat[i] ** 2;

        const threshold = 0.002;

        if (v < threshold) continue;

        const startIndex =
          i - Math.floor(audioContext.sampleRate * WINDOW_SIZE_SECOND * 0.04);
        const endIndex =
          i + Math.floor(audioContext.sampleRate * WINDOW_SIZE_SECOND * 0.96);

        const startDate =
          audioContext.currentTime -
          (dataArrayFloat.length - startIndex) / audioContext.sampleRate;
        const endDate =
          audioContext.currentTime -
          (dataArrayFloat.length - endIndex) / audioContext.sampleRate;
        const data = dataArrayFloat.subarray(startIndex, endIndex);

        if (hits.some((h) => h.startDate <= endDate && startDate <= h.endDate))
          continue;

        addHit(startDate, endDate, data);
      }

      if (audioContext.currentTime > 5) {
        // debugger;
      } else {
        // setTimeout(loop, 10);
        requestAnimationFrame(loop);
      }
    };
    loop();
  }

  //
})().catch((err) => console.log("error", err));
