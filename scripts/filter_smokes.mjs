#!/usr/bin/env node
"use strict";

import fs from "fs";
import path from "path";

function readJSON(file) {
  const text = fs.readFileSync(file, "utf8");
  return JSON.parse(text);
}

function toArray(v) {
  return Array.isArray(v) ? v : [];
}

function extractMatch(obj) {
  // Accept either { data: { match: {...} } } or { match: {...} }
  if (obj && obj.data && obj.data.match) return obj.data.match;
  if (obj && obj.match) return obj.match;
  return null;
}

// In-place filter: keep original JSON structure and only filter arrays
function filterSmokesInPlace(root) {
  const match = extractMatch(root) ?? root;
  const players = toArray(match?.players);
  for (const p of players) {
    const pb = p?.playbackData;
    if (!pb) continue;
    const itemsOrig = toArray(pb.itemUsedEvents);
    const positionsOrig = toArray(pb.playerUpdatePositionEvents);

    // Filter itemUsedEvents to Smoke of Deceit only (itemId === 188)
    const smokeItems = itemsOrig.filter((it) => Number(it?.itemId) === 188 && Number.isFinite(Number(it?.time)));
    // Build allowed times set
    const times = new Set(smokeItems.map((it) => Number(it.time)));
    // Filter positions to matching times only
    const filteredPositions = positionsOrig
      .filter((ev) => times.has(Number(ev?.time)))
      .sort((a, b) => Number(a?.time) - Number(b?.time));

    // Write back filtered arrays, preserving structure
    if (pb.itemUsedEvents) pb.itemUsedEvents = smokeItems;
    if (pb.playerUpdatePositionEvents) pb.playerUpdatePositionEvents = filteredPositions;
  }
}

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (_) { }
}

function processOneFile(inPath, outPath) {
  let json;
  try {
    json = readJSON(inPath);
  } catch (e) {
    console.error(`Failed to parse JSON: ${inPath}: ${e.message}`);
    return false;
  }
  // Filter in place, preserving original structure
  filterSmokesInPlace(json);
  const text = JSON.stringify(json, null, 2);
  fs.writeFileSync(outPath, text);
  console.log(`Wrote ${outPath}`);
  return true;
}

function main() {
  const args = process.argv.slice(2);
  let inArg = null;
  let outArg = null;
  let inDir = null;
  let outDir = null;
  let suffix = ".json";

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--out" || a === "-o") {
      outArg = args[++i];
    } else if (a === "--inDir") {
      inDir = args[++i];
    } else if (a === "--outDir") {
      outDir = args[++i];
    } else if (a === "--suffix") {
      suffix = args[++i];
    } else if (!inArg) {
      inArg = a;
    }
  }

  // Defaults per request: read from ./matches_full and write to ./matches
  const cwd = process.cwd();
  const defaultInDir = path.resolve(cwd, "matches_full");
  const defaultOutDir = path.resolve(cwd, "public", "matches");

  if (!inArg && !inDir) {
    inDir = defaultInDir;
  }
  if (!outArg && !outDir) {
    outDir = defaultOutDir;
  }

  // Directory mode
  if (inDir) {
    const absInDir = path.resolve(cwd, inDir);
    const absOutDir = path.resolve(cwd, outDir || defaultOutDir);
    if (!fs.existsSync(absInDir) || !fs.statSync(absInDir).isDirectory()) {
      console.error(`Input directory not found: ${absInDir}`);
      process.exit(1);
    }
    ensureDir(absOutDir);
    const files = fs.readdirSync(absInDir).filter((f) => f.endsWith(".json"));
    if (!files.length) {
      console.error(`No .json files found in ${absInDir}`);
      process.exit(1);
    }
    let ok = 0;
    for (const f of files) {
      const inPath = path.join(absInDir, f);
      const base = path.basename(f, path.extname(f));
      const outName = suffix ? `${base}${suffix}` : `${base}.json`;
      const outPath = path.join(absOutDir, outName);
      if (processOneFile(inPath, outPath)) ok++;
    }
    console.log(`Done: ${ok}/${files.length} files written to ${absOutDir}`);
    return;
  }

  // Single-file mode
  if (!inArg) {
    console.error(
      "Usage: node scripts/filter_smokes.js [--inDir ./matches_full] [--outDir ./matches] [--suffix .smokes.json] <match.json> [--out output.json]"
    );
    process.exit(1);
  }
  const absIn = path.resolve(cwd, inArg);
  if (!fs.existsSync(absIn)) {
    console.error(`Input file not found: ${inArg}`);
    process.exit(1);
  }
  const outPath = outArg
    ? path.resolve(cwd, outArg)
    : path.join(
      path.resolve(cwd, outDir || defaultOutDir),
      path.basename(inArg, path.extname(inArg)) + (suffix || ".json")
    );
  ensureDir(path.dirname(outPath));
  processOneFile(absIn, outPath);
}

main();
