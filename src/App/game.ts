export type InputKind = "ring" | "skin";

export type Input = { time: number; kind: InputKind; hand: "left" | "right" };

export type Game = {
  track: { title: string; audio: HTMLAudioElement };
  goals: (
    | { kind: "ring" | "skin"; time: number }
    | { kind: "blast"; time: number; duration: number }
  )[];
  trackStartedDate: number;
  inputs: Input[];
};

export const isInput = (x: any): x is Input => x && typeof x.time === "number";

export const registerInput = (game: Game, input: Input) => ({
  ...game,
  inputs: [...game.inputs, input],
});

export const createInitialGame = (
  track: Game["track"],
  goals: Game["goals"],
  trackStartedDate: number
): Game => {
  return { track, goals, trackStartedDate, inputs: [] };
};
