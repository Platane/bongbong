import type { Note, Partition } from "./game";

// @ts-ignore
import track1_url from "../asset/Different Heaven & EH!DE - My Heart.m4a";

// @ts-ignore
import track2_url from "../asset/DEAF KEV - Invincible.m4a";

// @ts-ignore
import track3_url from "../asset/DragonForce - Through the Fire and Flames.m4a";

const toNotes = (
  sequence: string,
  { bpm, offset = 0 }: { bpm: number; offset?: number }
): { bpm: number; offset: number; partition: Partition } => {
  const period = 1 / (bpm / 60);

  let i = 0;

  const partition = sequence
    .split("")
    .map((s) => {
      const time = i * period + offset;

      if (!s.match(/[RS\-]/)) return;

      i++;

      if (s === "R") return { time, kind: "ring" } as Note;

      if (s === "S") return { time, kind: "skin" } as Note;
    })
    .filter(isNoUndefined);

  return { partition, bpm, offset };
};

const isNoUndefined = <T>(x: T | undefined): x is NonNullable<T> =>
  x !== undefined;

export const tracks = [
  {
    title: "Different Heaven & EH!DE - My Heart",
    src: track1_url,
    ...toNotes(
      `
      S - - - | S - - - | S - - - | S - - - | S - - - | S - - - | 
      
      `,
      { bpm: 174, offset: 2.7 }
    ),
  },
  {
    title: "DEAF KEV - Invincible.m4a",
    src: track2_url,
    ...toNotes("", { bpm: 1, offset: 0 }),
  },
  {
    title: "DragonForce - Through the Fire and Flames",
    src: track3_url,
    ...toNotes(
      `
      S - - - |
      
      `,
      { bpm: 200, offset: 1.6 }
    ),
  },
];
