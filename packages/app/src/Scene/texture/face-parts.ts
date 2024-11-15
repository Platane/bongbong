const r = 9;

/**
 *
 * using this pattern to draw circle
 *  M (CX - R), CY
 *  a R,R 0 1,0 (R * 2),0
 *  a R,R 0 1,0 -(R * 2),0
 */
export const eyesOpen = `
M ${-22 - r}, ${-8}
a ${r},${r} 0 1,0 ${r * 2},0
a ${r},${r} 0 1,0 -${r * 2},0
z

M ${22 - r}, ${-8}
a ${r},${r} 0 1,0 ${r * 2},0
a ${r},${r} 0 1,0 -${r * 2},0
z
`;

export const uwuMouth = `
M 0, 9
a 10, 10, 0, 0, 0, 18, 2.6
M 0, 9
a 10, 10, 0, 0, 1, -18, 2.6
`;
