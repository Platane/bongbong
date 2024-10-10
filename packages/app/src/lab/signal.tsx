const STORE_URL = "https://bong-bong--webrtc-signal.platane.workers.dev";

export const signalGet = async <R = any,>(
  key: string,
  { signal }: { signal?: AbortSignal } = {}
) => {
  const res = await fetch(STORE_URL + "/blob/" + key, {
    method: "GET",
    signal,
  });

  if (res.ok) return res.json() as Promise<R>;

  if (res.status !== 404) throw await res.text().catch(() => res.statusText);

  return null;
};

export const signalListen = async <R = any,>(
  key: string,
  {
    pollingDuration = 2000,
    signal,
  }: { pollingDuration?: number; signal?: AbortSignal } = {}
) => {
  while (true) {
    const value = await signalGet<R>(key, { signal });

    if (value) return value;

    await new Promise((r) => setTimeout(r, pollingDuration));
  }
};

export const signalSend = (
  key: string,
  data: any,
  { signal }: { signal?: AbortSignal } = {}
) =>
  fetch(STORE_URL + "/blob/" + key, {
    body: JSON.stringify(data, null, 2),
    method: "PUT",
    signal,
  }).then((res) => {
    if (!res.ok) return res.text().catch(() => res.statusText);
  });
