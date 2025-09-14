// Utility functions for Dota2 TI14 Stats

export const WORLD_MIN = 60;
export const WORLD_MAX = 200;
export const WORLD_SPAN = WORLD_MAX - WORLD_MIN + 1;
export const BASE_MAP_WIDTH = 800;
export const TARGET_TEAM_ID = 9247354;

export const SENTRY_LIFE = 6 * 60; // seconds
export const OBS_LIFE = 7 * 60; // seconds
export const SMOKE_LIFE = 60; // seconds

export function worldToMap(x, y, imgW, imgH) {
  const normX = (x - WORLD_MIN) / WORLD_SPAN;
  const normY = (WORLD_MAX - y) / WORLD_SPAN;
  return [normX * imgW, normY * imgH];
}

export function secToClock(s) {
  const sign = s < 0 ? "-" : "";
  const abs = Math.abs(s) | 0;
  const m = Math.floor(abs / 60);
  const sec = abs % 60;
  return `${sign}${m}:${sec.toString().padStart(2, "0")}`;
}

export function filterActive(points, t) {
  return points.filter((p) => {
    const life = p.type === 0 ? SENTRY_LIFE : OBS_LIFE;
    return p.time <= t && t < p.time + life;
  });
}

export async function fetchJSON(path) {
  const candidates = [path, path.startsWith("/") ? path : `/${path}`];
  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (_) {}
  }
  throw new Error(`Failed to fetch ${path}`);
}
