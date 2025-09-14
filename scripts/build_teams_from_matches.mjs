#!/usr/bin/env node
"use strict";

import fs from "fs";
import path from "path";

const inPath = path.resolve(process.cwd(), "matches_full", "matches.json");
const outPath = path.resolve(process.cwd(), "matches_full", "teams.json");

if (!fs.existsSync(inPath)) {
  console.error(`Input not found: ${inPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(inPath, "utf8");
let arr = [];
try {
  arr = JSON.parse(raw);
} catch (e) {
  console.error(`Failed to parse ${inPath}: ${e.message}`);
  process.exit(1);
}

const byId = new Map();
for (const m of Array.isArray(arr) ? arr : []) {
  if (!m) continue;
  const rId = m.radiantTeamId ?? m.radiant_team_id;
  const dId = m.direTeamId ?? m.dire_team_id;
  const rName = m.radiantTeam?.name ?? m.radiant_team?.name ?? null;
  const dName = m.direTeam?.name ?? m.dire_team?.name ?? null;
  if (Number.isFinite(rId)) {
    if (!byId.has(rId)) byId.set(rId, { id: rId, name: rName || String(rId) });
    else if (rName && !byId.get(rId).name) byId.get(rId).name = rName;
  }
  if (Number.isFinite(dId)) {
    if (!byId.has(dId)) byId.set(dId, { id: dId, name: dName || String(dId) });
    else if (dName && !byId.get(dId).name) byId.get(dId).name = dName;
  }
}

const teams = Array.from(byId.values()).sort((a, b) => {
  if (a.name && b.name && a.name !== b.name) return a.name.localeCompare(b.name);
  return a.id - b.id;
});

fs.writeFileSync(outPath, JSON.stringify(teams, null, 2));
console.log(`Wrote ${outPath} (${teams.length} teams)`);

