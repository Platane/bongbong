import { black, mouth, red } from "./theme";

const lineWidth = 2.5;

export const uwuMouth = `<path d="
M 0, 8
a 10, 10, 0, 0, 0, 18, 2.6
M 0, 8
a 10, 10, 0, 0, 1, -18, 2.6
"
fill="none"
stroke-linecap="round"
stroke="${black}"
stroke-width="${lineWidth}"
/>
`;

export const openMouth = `
<path d="
M 0, 8
A 10, 10, 0, 0, 0, 12, 15
C 8, 36, -8, 36, -12, 15 
A 10, 10, 0, 0, 0, 0, 8
"
fill="${mouth}"
stroke-linecap="round"
stroke-linejoin="round"
stroke="${black}"
stroke-width="${lineWidth}"
/>

<path d="
M 0, 8
a 10, 10, 0, 0, 0, 18, 2.6
M 0, 8
a 10, 10, 0, 0, 1, -18, 2.6
"
fill="none"
stroke-linecap="round"
stroke="${black}"
stroke-width="${lineWidth}"
/>

`;

export const eyesOpen = `
<circle r="9" cx="-22" cy="-8" fill="${black}" />
<circle r="9" cx="22" cy="-8" fill="${black}" />
`;

export const eyesMischief = `
<path d="
M 29.2, -13.2
A 9, 9, 0, 1, 1, 13, -7
z
M -29.2, -13.2
A 9, 9, 0, 1, 0, -13, -7
z
"
fill="${black}"
/>
`;

export const circleHead = (color: string) => `
<circle cx="0" cy="0" r="50" fill="${black}" /> 
<circle cx="0" cy="0" fill="#fff" r="${50 - lineWidth}" /> 
<circle cx="0" cy="0" fill="${color}" r="${50 - 14}" /> 
`;

export const svg = (content: string) =>
  `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
