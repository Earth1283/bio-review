export function linearScale(domainStart: number, domainEnd: number, rangeStart: number, rangeEnd: number) {
  const pixelsPerUnit = (rangeEnd - rangeStart) / (domainEnd - domainStart);
  return (value: number) => rangeStart + (value - domainStart) * pixelsPerUnit;
}

export function roundUpToNiceNumber(value: number): number {
  const powerOfTen = 10 ** Math.floor(Math.log10(value));
  const mantissa = value / powerOfTen;
  const niceMantissa = mantissa <= 1 ? 1 : mantissa <= 2 ? 2 : mantissa <= 2.5 ? 2.5 : mantissa <= 5 ? 5 : 10;
  return niceMantissa * powerOfTen;
}

export function tickValues(max: number, approximateCount = 5): number[] {
  const step = roundUpToNiceNumber(max / approximateCount);
  const values: number[] = [];
  for (let value = 0; value <= max + step * 1e-6; value += step) values.push(+value.toFixed(6));
  return values;
}

export function svgLinePath(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
}

export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const formatNumber = (value: number, decimals = 0) =>
  value.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
