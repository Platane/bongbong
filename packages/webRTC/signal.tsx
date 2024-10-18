const STORE_URL = "https://bong-bong--webrtc-signal.platane.workers.dev";

export const signalBroadcast = async <D,>(
  key: string,
  data: D,
  { signal }: { signal?: AbortSignal } = {}
) => {
  while (true) {
    const res = await fetch(STORE_URL + "/room/" + key, {
      body: JSON.stringify(data),
      method: "PUT",
      signal,
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) return;

    if (!(res.status === 409 && (await res.text()) === "concurrent write"))
      throw await res.text().catch(() => res.statusText);
  }
};

export const signalListen = <D,>(
  key: string,
  onMessages: (data: D[]) => void,
  { pollingDuration = 5000 }: { pollingDuration?: number | (() => number) } = {}
) => {
  const abortController = new AbortController();

  let i = 0;

  let lastModifiedDate: string | null = null;

  const loop = async () => {
    if (abortController.signal.aborted) return;

    const res = await fetch(STORE_URL + "/room/" + key, {
      method: "GET",
      signal: abortController.signal,
      headers: {
        ...(lastModifiedDate ? { "If-Modified-Since": lastModifiedDate } : {}),
      },
    });

    if (res.status === 304) {
      //
    } else if (res.ok) {
      lastModifiedDate = res.headers.get("Last-Modified");
      const list = await res.json();
      onMessages(list.slice(i));
      i = list.length;
    } else if (res.status !== 404) throw res.text().catch(() => res.statusText);

    setTimeout(
      loop,
      typeof pollingDuration === "number" ? pollingDuration : pollingDuration()
    );
  };

  loop();

  return abortController.abort;
};

export const signalGet = async <D,>(
  key: string,
  { signal }: { signal?: AbortSignal } = {}
) => {
  const res = await fetch(STORE_URL + "/room/" + key, {
    method: "GET",
    signal,
  });

  if (res.ok) return (await res.json()) as D;

  if (res.status === 404) return null;

  throw res.text().catch(() => res.statusText);
};
