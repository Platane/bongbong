export type InputKind = "ring" | "skin";

export type Hand = "left" | "right";

export type Input = { time: number; kind: InputKind; hand: Hand };

export type Note = { kind: InputKind; time: number };
// | { kind: "blast"; time: number; duration: number };

export type Partition = Note[];

export type Track = {
  title: string;
  audio: HTMLAudioElement;
  bpm: number;
  offset: number;
  partition: Partition;
};

export type Game = {
  track: Track;
  inputs: Input[];
};

export const isInput = (x: any): x is Input => x && typeof x.time === "number";

export type Hit =
  | { kind: InputKind; type: "miss"; time: number; missedInput: Input | null }
  | {
      kind: InputKind;
      type: "hit";
      timing: "good" | "ok";
      time: number;
      input: Input;
    }
  | { type: "unwarranted"; time: number; input: Input };

const GOOD_THRESHOLD = 0.05;
const OK_THRESHOLD = 0.1;
const MERGE_THRESHOLD = 0.2;
export const getHits = (
  partition: Partition,
  inputs: Input[],
  currentTime: number
) => {
  let i = 0;
  let j = 0;

  const hits: Hit[] = [];

  for (
    ;
    j < partition.length && partition[j].time < currentTime - OK_THRESHOLD;
    j++
  ) {
    while (inputs[i] && inputs[i].time < partition[j].time - OK_THRESHOLD) {
      hits.push({
        time: inputs[i].time,
        type: "unwarranted",
        input: inputs[i],
      });

      i++;
    }

    if (
      inputs[i] &&
      Math.abs(inputs[i].time - partition[j].time) <= OK_THRESHOLD
    ) {
      const timing =
        Math.abs(inputs[i].time - partition[j].time) < GOOD_THRESHOLD
          ? "good"
          : "ok";

      if (inputs[i].kind !== partition[j].kind) {
        hits.push({ ...partition[j], type: "miss", missedInput: inputs[i] });
      } else {
        hits.push({ ...partition[j], type: "hit", timing, input: inputs[i] });
      }
      i++;
    } else {
      hits.push({ ...partition[j], type: "miss", missedInput: null });
    }
  }

  for (; i < inputs.length; i++) {
    while (partition[j] && partition[j].time < inputs[i].time - OK_THRESHOLD) {
      hits.push({ ...partition[j], type: "miss", missedInput: null });

      j++;
    }

    if (
      partition[j] &&
      Math.abs(inputs[i].time - partition[j].time) <= OK_THRESHOLD
    ) {
      const timing =
        Math.abs(inputs[i].time - partition[j].time) < GOOD_THRESHOLD
          ? "good"
          : "ok";

      if (inputs[i].kind !== partition[j].kind) {
        hits.push({ ...partition[j], type: "miss", missedInput: inputs[i] });
      } else {
        hits.push({ ...partition[j], type: "hit", timing, input: inputs[i] });
      }
      j++;
    } else {
      hits.push({
        type: "unwarranted",
        input: inputs[i],
        time: inputs[i].time,
      });
    }
  }

  mergeMissUnwarranted(hits);

  const shouldCheckAgainAtTime = partition[j]
    ? partition[j].time + OK_THRESHOLD
    : Infinity;

  const nextNoteIndex = j;

  return { hits, nextNoteIndex, shouldCheckAgainAtTime };
};

const mergeMissUnwarranted = (hits: Hit[]) => {
  for (let i = hits.length; i--; ) {
    const hit = hits[i];
    if (hit.type === "miss" && !hit.missedInput) {
      const afterDelta =
        hits[i + 1]?.type === "unwarranted"
          ? hit.time - hits[i + 1].time
          : Infinity;
      const beforeDelta =
        hits[i - 1]?.type === "unwarranted"
          ? hits[i - 1].time - hit.time
          : Infinity;

      if (afterDelta < MERGE_THRESHOLD && afterDelta < beforeDelta) {
        hit.missedInput = (
          hits[i + 1] as Extract<Hit, { type: "unwarranted" }>
        ).input;
        hits.splice(i + 1, 1);
      }
      if (beforeDelta < MERGE_THRESHOLD && beforeDelta < afterDelta) {
        hit.missedInput = (
          hits[i - 1] as Extract<Hit, { type: "unwarranted" }>
        ).input;
        hits.splice(i - 1, 1);
      }
    }
  }
};

export const getScore = (hits: Hit[]) => {
  let combo = 0;
  let score = 0;

  const getMultiplier = (chain: number) =>
    Math.min(10, 1 + Math.floor(chain / 6));

  for (const h of hits) {
    if (h.type === "hit") {
      combo++;
      score += getMultiplier(combo) * (h.timing === "good" ? 100 : 50);
    }

    if (h.type === "miss" || h.type === "unwarranted") {
      combo = 0;
    }
  }

  return { multiplier: getMultiplier(combo), combo, score };
};
