#!/usr/bin/env node
"use strict";

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
let outPath = null;
let inPath = null; // Optional JSON file with match IDs
// Array of { matchId: string }
const ids = [];

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--out" || a === "-o") {
    if (i + 1 >= args.length) {
      console.error("Missing value for --out");
      process.exit(1);
    }
    outPath = args[++i];
  } else if (a === "--file" || a === "-f") {
    if (i + 1 >= args.length) {
      console.error("Missing value for --file");
      process.exit(1);
    }
    inPath = args[++i];
  } else {
    // Accept form: <matchId>
    const raw = String(a).trim();
    ids.push({ matchId: raw });
  }
}

// If no IDs were provided via CLI, try loading from JSON file.
if (ids.length === 0) {
  const defaultPath =
    inPath || path.join(process.cwd(), "matches_full", "matches.json");
  try {
    if (fs.existsSync(defaultPath)) {
      const raw = fs.readFileSync(defaultPath, "utf8");
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (!item) continue;
          const matchId = String(
            item.match_id ?? item.matchId ?? item.id ?? ""
          ).trim();
          if (matchId) ids.push({ matchId });
        }
      }
    }
  } catch (e) {
    console.error(`Failed to read matches from ${defaultPath}: ${e.message}`);
  }
}

if (ids.length === 0) {
  console.error(
    "Usage: node scripts/fetch_stratz_wards.mjs [--file matches_full/matches.json] [--out output.json] <matchId ...>"
  );
  process.exit(1);
}

const apiKey = process.env.STRATZ_API_KEY;
const endpoint = `https://api.stratz.com/graphql?key=${apiKey}`;

function buildQuery(id) {
  return `query {
    match(id: ${id}) {
      leagueId
      direTeam {
        name
      }
      direTeamId
      radiantTeam {
        name
      }
      radiantTeamId
      durationSeconds
      players {
        playbackData {
          itemUsedEvents { time itemId  }
          playerUpdatePositionEvents { time x y }
        }
        hero{
          displayName
        }
        steamAccountId
        isRadiant
        stats {
          wards {
            time
            type
            positionX
            positionY
          }
        }
      }
    }
  }`;
}

function isNumericId(v) {
  return /^\d+$/.test(String(v));
}

async function fetchMatch(id) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ query: buildQuery(id) }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors) {
    const msg = Array.isArray(json.errors)
      ? json.errors.map((e) => e.message).join("; ")
      : String(json.errors);
    throw new Error(`GraphQL error: ${msg}`);
  }
  return json.data.match;
}

(async function run() {
  const results = [];
  const errors = [];
  const outDir = path.join(process.cwd(), "matches_full");
  try {
    fs.mkdirSync(outDir, { recursive: true });
  } catch (e) {
    console.error(`Unable to ensure output dir '${outDir}': ${e.message}`);
    process.exit(1);
  }

  for (const rec of ids) {
    const id = String(rec.matchId).trim();
    if (!isNumericId(id)) {
      errors.push({ id, error: "Invalid match ID (must be digits)" });
      continue;
    }
    try {
      let data = await fetchMatch(id);
      data = {
        ...data,
        players: Array.isArray(data.players) ? data.players : [],
      };
      results.push({ id, data });

      // Write per-match file: matches/<match_id>.json
      const filePath = path.join(outDir, `${id}.json`);
      const perFilePayload = { data: { match: data } };
      fs.writeFileSync(filePath, JSON.stringify(perFilePayload, null, 2));
      console.log(`Wrote ${filePath}`);
      // Small delay to be polite
      await new Promise((r) => setTimeout(r, 120));
    } catch (err) {
      errors.push({ id, error: err.message });
    }
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    matches: results,
    errors,
  };

  const text = JSON.stringify(output, null, 2);
  if (outPath) {
    fs.writeFileSync(outPath, text);
    console.log(
      `Wrote ${results.length} matches to ${outPath}${
        errors.length ? ` with ${errors.length} errors` : ""
      }.`
    );
  } else {
    console.log(text);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
