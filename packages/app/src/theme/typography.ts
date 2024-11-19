export const generateTextShadowOutline = ({
  color,
  width,
  n = 5 + Math.floor(Math.min(7, width)),
  blur = Math.min(width * 0.3, 3),
}: {
  n?: number;
  color: string;
  width: number;
  blur?: number;
}) => {
  const f = (x: number) => Math.round(x * 10) / 10;

  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const x = width * Math.cos(a);
    const y = width * Math.sin(a);

    return `${f(x)}px ${f(y)}px ${blur}px ${color}`;
  }).join(" , ");
};
