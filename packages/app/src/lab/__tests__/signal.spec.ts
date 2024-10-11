import { expect, test } from "bun:test";
import { signalBroadcast, signalListen } from "../signal";

test(
  "broadcast / listen",
  async () => {
    const key = "test" + Math.random().toString().slice(2);

    await signalBroadcast(key, { message: "one" });

    const messages: any[] = [];

    const unlisten = signalListen(key, (message) => messages.push(message), {
      pollingDuration: 1000,
    });

    await signalBroadcast(key, { message: "two" });

    await new Promise((r) => setTimeout(r, 2500));

    expect(messages).toEqual([{ message: "one" }, { message: "two" }]);
  },
  { timeout: 10000 }
);
