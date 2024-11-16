import { expect, test } from "bun:test";
import { getHits, Input, Partition } from "../game";

test("get hits", () => {
  const partition: Partition = [
    { kind: "ring", time: 0 },
    { kind: "ring", time: 1 },
  ];
  const inputs: Input[] = [
    {
      kind: "ring",
      time: 0,
      hand: "left",
    },
    {
      kind: "ring",
      time: 1.08,
      hand: "left",
    },
  ];

  const { hits } = getHits(partition, inputs, 999999);

  expect(hits).toEqual([
    { kind: "ring", time: 0, timing: "good", type: "hit", input: inputs[0] },
    { kind: "ring", time: 1, timing: "ok", type: "hit", input: inputs[1] },
  ]);
});

test("merge unwanted and miss", () => {
  const partition: Partition = [{ kind: "ring", time: 3 }];
  const inputs: Input[] = [
    {
      kind: "ring",
      time: 3.11,
      hand: "left",
    },
  ];

  const { hits } = getHits(partition, inputs, 999999);

  expect(hits).toEqual([
    { kind: "ring", time: 3, type: "miss", missedInput: inputs[0] },
  ]);
});

test("merge unwanted and miss", () => {
  const partition: Partition = [{ kind: "ring", time: 3 }];
  const inputs: Input[] = [
    {
      kind: "ring",
      time: 3.11,
      hand: "left",
    },
  ];

  const { hits } = getHits(partition, inputs, 3);

  expect(hits).toEqual([
    { kind: "ring", time: 3, type: "miss", missedInput: inputs[0] },
  ]);
});
