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

/**
 * returns the score
 * or 0 if miss
 */
export const hitTest = (note: Note, input: Input) => {
  if (note.kind !== input.kind) return 0;
  const delta = Math.abs(note.time - input.time);
  if (delta > 0.5) return 0;
  if (delta > 0.2) return 1;
  return 2;
};
