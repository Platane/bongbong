import * as React from "react";
import { useState } from "./useState0";

export const App = () => {
  const state = useState();

  return (
    <>
      <h1>hello</h1>
      <pre>{JSON.stringify(state, null, 2)}</pre>;
    </>
  );
};
