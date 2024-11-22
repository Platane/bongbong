import * as React from "react";

export const Layout = ({
  mascot,
  score,
  playTrack,
  playTrackHeader,
  background,
  inputHelper,

  ...props
}: {
  //
  mascot?: React.ReactElement;
  score?: React.ReactElement;
  playTrack?: React.ReactElement;
  playTrackHeader?: React.ReactElement;
  background?: React.ReactElement;
  inputHelper?: React.ReactElement;

  style?: React.CSSProperties;
  className?: string;
}) => (
  <div
    {...props}
    style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
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
        height: "min( 30% , 330px )",
        display: "flex",
        flexDirection: "row",
        position: "relative",
        gap: "8px",
      }}
    >
      <div
        style={{
          width: "min(  300px , 80%  )",
          height: "100%",
          display: "flex",
        }}
      >
        <div
          style={{
            marginTop: "auto",
            width: "100%",
            maxHeight: "100%",
            // backgroundColor: "#a54287",
            aspectRatio: 1,
            position: "relative",
          }}
        >
          {mascot}
        </div>
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
        height: "min( 34% , 260px )",
        display: "flex",
        flexDirection: "row",
        boxShadow: " 0px 0px 0px 6px #000",
        backgroundColor: "#444e",
        zIndex: 2,
      }}
    >
      <div
        style={{
          width: "min( 32% , 300px )",
          height: "100%",
          flexShrink: "0",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            display: "flex",
          }}
        >
          <div
            style={{
              marginLeft: "auto",
              aspectRatio: 1,
              maxWidth: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                aspectRatio: 1,
                maxHeight: "100%",
                width: "100%",
              }}
            >
              {inputHelper}
            </div>
          </div>
        </div>
        {score}
      </div>
      <div
        style={{
          width: "100%",
          height: "100%",
          flexGrow: "1",
          position: "relative",
        }}
      >
        {playTrack}
      </div>
    </div>
  </div>
);
