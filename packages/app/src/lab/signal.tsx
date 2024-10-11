const STORE_URL = "https://bong-bong--webrtc-signal.platane.workers.dev";

export const signalBroadcast = async (
  key: string,
  data: any,
  { signal }: { signal?: AbortSignal } = {}
) => {
  while (true) {
    const res = await fetch(STORE_URL + "/room/" + key, {
      body: JSON.stringify(data),
      method: "PUT",
      signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) return;

    if (!(res.status === 409 && (await res.text()) === "concurrent write"))
      throw await res.text().catch(() => res.statusText);
  }
};

export const signalListen = (
  key: string,
  onMessage: (data: any) => void,
  { pollingDuration = 5000 }: { pollingDuration?: number | (() => number) } = {}
) => {
  const abortController = new AbortController();

  let i = 0;

  const loop = async () => {
    if (abortController.signal.aborted) return;

    const res = await fetch(STORE_URL + "/room/" + key, {
      method: "GET",
      signal: abortController.signal,
    });

    if (res.ok) {
      const list = await res.json();

      for (; i < list.length; i++) {
        onMessage(list[i]);
      }
    } else if (res.status !== 404) throw res.text().catch(() => res.statusText);

    setTimeout(
      loop,
      typeof pollingDuration === "number" ? pollingDuration : pollingDuration()
    );
  };

  loop();

  return abortController.abort;
};

const assertOk = async (res: Response) => {
  if (!res.ok) throw await res.text().catch(() => res.statusText);
  return res;
};
