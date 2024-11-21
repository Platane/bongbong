const audioContext = new AudioContext();

/**
 * reference:
 * https://sonoport.github.io/synthesising-sounds-webaudio.html
 */

export const kick = () => {
  const osc = audioContext.createOscillator();
  const osc2 = audioContext.createOscillator();
  const gainOsc = audioContext.createGain();
  const gainOsc2 = audioContext.createGain();

  osc.type = "triangle";
  osc2.type = "sine";

  gainOsc.gain.setValueAtTime(1, audioContext.currentTime);
  gainOsc.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + 0.5
  );

  gainOsc2.gain.setValueAtTime(1, audioContext.currentTime);
  gainOsc2.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + 0.5
  );

  osc.frequency.setValueAtTime(120, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + 0.5
  );

  osc2.frequency.setValueAtTime(50, audioContext.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + 0.5
  );

  osc.connect(gainOsc);
  osc2.connect(gainOsc2);
  gainOsc.connect(audioContext.destination);
  gainOsc2.connect(audioContext.destination);

  osc.start(audioContext.currentTime);
  osc2.start(audioContext.currentTime);

  osc.stop(audioContext.currentTime + 0.5);
  osc2.stop(audioContext.currentTime + 0.5);
};

export const snare = () => {
  const osc3 = audioContext.createOscillator();
  const gainOsc3 = audioContext.createGain();
  const filterGain = audioContext.createGain();

  filterGain.gain.setValueAtTime(1, audioContext.currentTime);
  filterGain.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.2
  );

  osc3.type = "triangle";
  osc3.frequency.value = 100;

  gainOsc3.gain.value = 0;
  gainOsc3.gain.setValueAtTime(0, audioContext.currentTime);
  //gainOsc3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

  //Connections
  osc3.connect(gainOsc3);
  gainOsc3.connect(audioContext.destination);

  osc3.start(audioContext.currentTime);
  osc3.stop(audioContext.currentTime + 0.2);

  var node = audioContext.createBufferSource(),
    buffer = audioContext.createBuffer(1, 4096, audioContext.sampleRate),
    data = buffer.getChannelData(0);

  var filter = audioContext.createBiquadFilter();

  filter.type = "highpass";
  filter.frequency.setValueAtTime(100, audioContext.currentTime);
  filter.frequency.linearRampToValueAtTime(
    1000,
    audioContext.currentTime + 0.2
  );

  for (var i = 0; i < 4096; i++) {
    data[i] = Math.random();
  }

  node.buffer = buffer;
  node.loop = true;

  //Connections
  node.connect(filter);
  filter.connect(filterGain);
  filterGain.connect(audioContext.destination);

  node.start(audioContext.currentTime);
  node.stop(audioContext.currentTime + 0.2);
};
