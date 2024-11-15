import React from "react";
import * as THREE from "three";
import { InputKind } from "../../state/game";
import {
  faceBackgroundBlue,
  faceBackgroundRed,
  faceUwU,
} from "../texture/sprite";

export const Note = ({
  stance,
  kind,
  ...props
}: { stance: string; kind: InputKind } & React.ComponentProps<"group">) => {
  return (
    <group {...props}>
      <sprite>
        {kind === "ring" && <spriteMaterial map={faceBackgroundBlue} />}
        {kind === "skin" && <spriteMaterial map={faceBackgroundRed} />}
      </sprite>
      <sprite>
        <spriteMaterial map={faceUwU} />
      </sprite>
    </group>
  );
};
