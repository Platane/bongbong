export const createSubscribable = <A = void>() => {
  const listeners = new Set<(a: A) => void>();

  const broadcast = (a: A) => {
    for (const l of listeners) l(a);
  };
  const subscribe = (h: (a: A) => void) => {
    listeners.add(h);
    return () => {
      listeners.delete(h);
    };
  };
  const dispose = () => listeners.clear();

  return { broadcast, subscribe, dispose };
};
