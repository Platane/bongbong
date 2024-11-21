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
  miss,
  ...props
}: {
  miss?: boolean;
  stance: "uwu" | "openMouth" | "mischief";
  kind: InputKind;
} & React.ComponentProps<"group">) => {
  const colorProps: React.ComponentProps<"spriteMaterial"> = {
    ...(miss && { color: "#ccc", opacity: 0.8, transparent: true }),
  };

  return (
    <group {...props}>
      <sprite>
        {kind === "ring" && (
          <spriteMaterial {...colorProps} map={faceBackgroundRed} />
        )}
        {kind === "skin" && (
          <spriteMaterial {...colorProps} map={faceBackgroundBlue} />
        )}
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
