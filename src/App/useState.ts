import * as React from "react";
import { createState } from "./state";

export const useState = () => {
  const { getState, subscribe, dispose, ...methods } = React.useMemo(
    createState,
    []
  );

  const [, refresh] = React.useReducer((x) => 1 + x, 1);
  React.useEffect(() => subscribe(refresh), []);
  React.useEffect(() => dispose, []);

  return { ...methods, ...getState() };
};
