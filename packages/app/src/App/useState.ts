import * as React from "react";
import { createHostState } from "../state/hostState";
import { createGuestState } from "../state/guestState";

export const useHostState = (roomKey: string) => {
  const { getState, subscribe, dispose, ...methods } = React.useMemo(
    () => createHostState(roomKey),
    [roomKey]
  );

  const [, refresh] = React.useReducer((x) => 1 + x, 1);
  React.useEffect(() => subscribe(refresh), []);
  React.useEffect(() => dispose, []);

  return { ...methods, ...getState() };
};

export const useGuestState = (roomKey: string) => {
  const { getState, subscribe, dispose, ...methods } = React.useMemo(
    () => createGuestState(roomKey),
    [roomKey]
  );

  const [, refresh] = React.useReducer((x) => 1 + x, 1);
  React.useEffect(() => subscribe(refresh), []);
  React.useEffect(() => dispose, []);

  return { ...methods, ...getState() };
};
