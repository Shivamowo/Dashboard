/** Deterministic PRNG so server and client render identical fixture values. */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const int = (r: () => number, min: number, max: number) =>
  min + Math.floor(r() * (max - min + 1));

export const pick = <T,>(r: () => number, arr: readonly T[]): T =>
  arr[Math.floor(r() * arr.length)];

export const chance = (r: () => number, p: number) => r() < p;
