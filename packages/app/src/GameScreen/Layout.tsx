import * as React from "react";

export const Layout = ({
  mascot,
  score,
  playTrack,
  playTrackHeader,
  background,

  ...props
}: {
  //
  mascot?: React.ReactElement;
  score?: React.ReactElement;
  playTrack?: React.ReactElement;
  playTrackHeader?: React.ReactElement;
  background?: React.ReactElement;

  style?: React.CSSProperties;
  className?: string;
}) => (
  <div
    {...props}
    style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#f61",
      overflow: "hidden",
      ...props.style,
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      {background}
    </div>
    <div
      style={{
        width: "100%",
        height: "min( 30% , 300px )",
        display: "flex",
        flexDirection: "row",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "min(  200px , 80% , 90% )",
          height: "100%",
          backgroundColor: "#154",
          position: "relative",
        }}
      >
        {mascot}
      </div>

      <div
        style={{
          width: "min(  300px , 50%  )",
          height: "50px",
          marginTop: "auto",
          marginLeft: "auto",
          backgroundColor: "#7db417",

          position: "relative",
        }}
      >
        {playTrackHeader}
      </div>
    </div>

    <div
      style={{
        width: "100%",
        height: "min( 30% , 240px )",
        display: "flex",
        flexDirection: "row",
        boxShadow: " 0px 0px 0px 6px #000",
        zIndex: 2,
      }}
    >
      <div
        style={{
          width: "min( 30% , 300px )",
          height: "100%",
          flexShrink: "0",
          backgroundColor: "#33d2ee",
          position: "relative",
        }}
      >
        {score}
      </div>
      <div
        style={{
          width: "100%",
          height: "100%",
          flexGrow: "1",
          backgroundColor: "#e38",
          position: "relative",
        }}
      >
        {playTrack}
      </div>
    </div>
  </div>
);
