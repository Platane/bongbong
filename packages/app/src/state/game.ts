export type InputKind = "ring" | "skin";

export type Hand = "left" | "right";

export type Input = { time: number; kind: InputKind; hand: Hand };

export type Note =
  | { kind: InputKind; time: number }
  | { kind: "blast"; time: number; duration: number };

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
