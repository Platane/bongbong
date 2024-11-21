import * as React from "react";
import { createHostState } from "../state/hostState";
import { createGuestState } from "../state/guestState";
import type { Game } from "../state/game";
import * as sound from "../sound";

export const useHostState = (roomKey: string) => {
  const { getState, subscribe, dispose, ...methods } = React.useMemo(
    () => createHostState(roomKey),
    [roomKey]
  );

  const [, refresh] = React.useReducer((x) => 1 + x, 1);
  React.useEffect(() => subscribe(refresh), []);
  React.useEffect(() => dispose, []);

  // play sound
  React.useEffect(() => {
    let lastGame: Game | undefined = getState().game;
    return subscribe(() => {
      const game = getState().game;

      const lastIndexIndex = lastGame?.inputs.length ?? 0;

      lastGame = game;

      if (!game) return;

      for (let i = lastIndexIndex; i < game.inputs.length; i++) {
        const input = game.inputs[i];

        if (input.kind === "skin") sound.kick();
        if (input.kind === "ring") sound.snare();
      }
    });
  }, []);

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
