# Dota React

A minimal React + Vite setup added on top of the existing data/scripts. It fetches JSON from `matches/` and shows a small sample view.

## Quick Start

1. Install deps

   - npm: `npm install`
   - pnpm: `pnpm install`
   - yarn: `yarn`

2. Run the dev server

   - `npm run dev`

3. Open the URL printed by Vite (usually `http://localhost:5173`).

## Notes

- The old static demo remains at `public/index-vanilla.html` with assets under `public/`.
- The React app reads `matches/matches.json` and one sample `matches/{id}.json` directly.
- If you generate `public/html/preloaded_matches.js`, the app will prefer it when available.

