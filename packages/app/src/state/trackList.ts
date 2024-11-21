import type { Note, Partition } from "../state/game";

// @ts-ignore
import track1_url from "../asset/Different Heaven & EH!DE - My Heart.m4a";

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

      if (!s.match(/[RSB\-]/)) return;

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
    // src: "https://github.com/user-attachments/assets/06c4649f-1e4f-4816-9e99-87717bbf7b00",
    ...toNotes(
      `
      - - - - | S - - - | S - - - | S - - - |
      S - - - | S - - - | S - - - | S - R R | 
      S - - - | - - - - | - - - - | - - - - |
      - - - - | R R R R | - S - S | - - - - |
      S - - S | S - S - | R R R R | - - - - |
      - - - - | - - - - | - - - - | - - - - |
      
      `,
      { bpm: 174, offset: 0 }
    ),
  },
  {
    title: "DEAF KEV - Invincible.m4a",
    src: "https://github.com/user-attachments/assets/ac0c3def-221d-431e-b59d-5887c6d22d79",
    ...toNotes("", { bpm: 1, offset: 0 }),
  },
  {
    title: "DragonForce - Through the Fire and Flames",
    src: "https://github.com/user-attachments/assets/d6d1d7cb-528c-4072-bec9-de64767963ce",
    ...toNotes(
      `
      S - - - |
      
      `,
      { bpm: 200, offset: 1.6 }
    ),
  },
];
