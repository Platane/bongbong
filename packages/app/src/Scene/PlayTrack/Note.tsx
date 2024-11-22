import React from "react";
import * as THREE from "three";
import { InputKind } from "../../state/game";
import { textures } from "../texture/sprite";

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
          <spriteMaterial {...colorProps} map={textures.faceBackgroundRed} />
        )}
        {kind === "skin" && (
          <spriteMaterial {...colorProps} map={textures.faceBackgroundBlue} />
        )}
      </sprite>
      <sprite>
        <spriteMaterial
          map={
            (stance === "mischief" && textures.faceMischief) ||
            (stance === "openMouth" && textures.faceOpenMouth) ||
            textures.faceUwU
          }
        />
      </sprite>
    </group>
  );
};
