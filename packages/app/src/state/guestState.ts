import { createGuest } from "@bongbong/webRTC/multi-guest";
import { createSubscribable } from "../utils/subscribable";
import { Hand, InputKind } from "./game";
import { Message } from "./hostState";

export const createGuestState = (roomKey: string) => {
  const { subscribe, broadcast: broadcastStateChange } = createSubscribable();

  const guest = createGuest<Message>(roomKey);

  type State = {
    connectionStatus: ReturnType<typeof guest.getStatus>;
    description: { hand: Hand };
    inputs: { timestamp: number; kind: InputKind }[];
  };
  let state: State = {
    connectionStatus: guest.getStatus(),
    description: { hand: "right" },
    inputs: [],
  };

  guest.subscribeToStatusChange(() => {
    state = { ...state, connectionStatus: guest.getStatus() };
    broadcastStateChange();
  });

  guest.subscribeToMessage((data) => {
    if (data.type === "ping") {
      guest.send({
        type: "pong",
        answerRemoteDate: Date.now(),
        requestLocalDate: data.requestLocalDate,
      });
    }
  });

  const setRemoteDescription = (hand: Hand) => {
    state = { ...state, description: { hand } };

    guest.send({ type: "remote-description", hand });

    broadcastStateChange();
  };

  const inputRemote = (kind: InputKind) => {
    const input = { kind, timestamp: Date.now(), hand: state.description.hand };

    state = { ...state, inputs: [...state.inputs, input] };

    broadcastStateChange();

    guest.send({ type: "remote-input", ...input });
  };

  const reportSensor = (data: { alpha: number; gamma: number }) => {
    guest.send({
      type: "remote-report-sensor",
      ...data,
      timestamp: Date.now(),
    });
  };

  return {
    subscribe,
    getState: () => state,
    dispose: () => {
      guest.dispose();
    },

    setRemoteDescription,
    inputRemote,
    reportSensor,
  };
};
