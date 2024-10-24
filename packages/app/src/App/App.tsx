import * as React from "react";
import { Remote } from "./Remote";
import { Host } from "./Host";
import { Scene } from "../Scene/Scene";

export const App = () => {
  if (location.pathname.startsWith("/game")) {
    return <Scene style={{ width: "100vw", height: "100vh" }} />;
  }

  {
    const [, remoteRoomId] =
      location.pathname.match(/\/room\/(\w+)\/remote\/?/) ?? [];

    if (remoteRoomId) return <Remote roomId={remoteRoomId} />;
  }

  return <Viewer />;
};

const Viewer = () => {
  const [roomId, createRoom] = React.useReducer(
    (r) => r ?? generateId(),
    null as string | null
  );

  if (roomId) return <Host roomId={roomId} />;
  return <Home createRoom={createRoom} />;
};

const Home = ({ createRoom }: { createRoom: () => void }) => (
  <>
    <button onClick={createRoom}>create room</button>
  </>
);

const generateId = () =>
  Math.random()
    .toString(36)
    .slice(2, 6)
    .split("")
    .map((c) => (Math.random() > 0.5 ? c.toUpperCase() : c))
    .join("");
