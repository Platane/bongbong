export const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.mystunserver.tld" },
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun.l.google.com:5349" },
  ],
};
