import React from "react";
import * as THREE from "three";
import { InputKind } from "../../state/game";
import {
  faceBackgroundBlue,
  faceBackgroundRed,
  faceUwU,
  faceOpenMouth,
  faceMischief,
} from "../texture/sprite";

export const Note = ({
  stance,
  kind,
  ...props
}: {
  stance: "uwu" | "openMouth" | "mischief";
  kind: InputKind;
} & React.ComponentProps<"group">) => {
  return (
    <group {...props}>
      <sprite>
        {kind === "ring" && <spriteMaterial map={faceBackgroundRed} />}
        {kind === "skin" && <spriteMaterial map={faceBackgroundBlue} />}
      </sprite>
      <sprite>
        <spriteMaterial
          map={
            (stance === "mischief" && faceMischief) ||
            (stance === "openMouth" && faceOpenMouth) ||
            faceUwU
          }
        />
      </sprite>
    </group>
  );
};
