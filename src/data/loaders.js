import { fetchJSON } from "../utils";

// Return shape: { teamLine, filterLine, points, smokes }
export async function loadMatchData(matchId, selectedTeamId) {
  let teamLine = "";
  let filterLine = "";
  const points = [];
  const smokes = [];

  let data;
  try {
    data = await fetchJSON(`matches/${matchId}.json`);
  } catch (e) {
    throw new Error("比赛加载失败");
  }

  const match = data?.data?.match;
  if (!match) {
    return { teamLine: "", filterLine: "无比赛数据", points: [], smokes: [] };
  }

  const radName = match?.radiantTeam?.name || "天辉";
  const direName = match?.direTeam?.name || "夜魇";
  teamLine = `${radName} 对 ${direName}`;

  let isTargetRadiant = null;
  if (
    typeof match.radiantTeamId === "number" &&
    match.radiantTeamId === selectedTeamId
  ) {
    isTargetRadiant = true;
  } else if (
    typeof match.direTeamId === "number" &&
    match.direTeamId === selectedTeamId
  ) {
    isTargetRadiant = false;
  }

  if (isTargetRadiant === null) {
    filterLine = `筛选：本场不包含战队 ${selectedTeamId}`;
  } else {
    filterLine = `筛选：仅显示战队 ${selectedTeamId}（${
      isTargetRadiant ? "天辉" : "夜魇"
    }）的守卫`;
  }

  const playersRaw = Array.isArray(match.players) ? match.players : [];
  const players =
    isTargetRadiant === null
      ? playersRaw
      : playersRaw.filter((p) => !!p.isRadiant === !!isTargetRadiant);

  for (const p of players) {
    const wards = ((p || {}).stats || {}).wards || [];
    for (const w of wards) {
      if (w == null) continue;
      points.push({
        x: Number(w.positionX),
        y: Number(w.positionY),
        type: Number(w.type),
        time: Number(w.time),
        isRadiant: !!p.isRadiant,
      });
    }

    // collect Smoke uses at exact position timestamps if available
    const pb = (p && p.playbackData) || null;
    const itemEvents =
      pb && Array.isArray(pb.itemUsedEvents) ? pb.itemUsedEvents : [];
    const posEvents =
      pb && Array.isArray(pb.playerUpdatePositionEvents)
        ? pb.playerUpdatePositionEvents
        : [];
    if (itemEvents.length && posEvents.length) {
      const posByTime = new Map();
      for (const ev of posEvents) {
        if (!ev) continue;
        const tt = Number(ev.time);
        if (!Number.isFinite(tt)) continue;
        posByTime.set(tt, { x: Number(ev.x), y: Number(ev.y) });
      }
      for (const it of itemEvents) {
        if (!it) continue;
        if (Number(it.itemId) !== 188) continue; // Smoke of Deceit
        const tt = Number(it.time);
        const pos = posByTime.get(tt);
        if (!pos) continue;
        smokes.push({
          x: Number(pos.x),
          y: Number(pos.y),
          time: tt,
          kind: "smoke",
          isRadiant: !!p.isRadiant,
        });
      }
    }
  }

  return { teamLine, filterLine, points, smokes };
}

// Return shape: { teamLine, filterLine, points, smokes }
export async function loadAggregateData(side, teamId, teams, matchesIndex) {
  const wantRadiant = side === "radiant";
  const t = teams.find((x) => Number(x.id) === Number(teamId));
  const tName = t?.name || String(teamId);
  const teamLine = `${tName} — ${wantRadiant ? "天辉" : "夜魇"}（全部）`;

  const arr = matchesIndex || [];
  const ids = arr
    .filter((m) => {
      const r = m.radiantTeamId ?? m.radiant_team_id;
      const d = m.direTeamId ?? m.dire_team_id;
      return wantRadiant ? r === teamId : d === teamId;
    })
    .map((m) => String(m.match_id ?? m.matchId ?? m.id))
    .filter(Boolean);

  const filterLine = `汇总：战队 ${teamId} 在 ${wantRadiant ? "天辉" : "夜魇"} 方的 ${ids.length} 场比赛`;

  const points = [];
  const smokes = [];

  for (const matchId of ids) {
    let data;
    try {
      data = await fetchJSON(`matches/${matchId}.json`);
    } catch (_) {
      continue;
    }
    const match = data?.data?.match;
    if (!match) continue;
    const isTargetRadiant =
      match.radiantTeamId === teamId
        ? true
        : match.direTeamId === teamId
        ? false
        : null;
    if (isTargetRadiant === null) continue;
    const players = (
      Array.isArray(match.players) ? match.players : []
    ).filter((p) => !!p.isRadiant === !!isTargetRadiant);
    for (const p of players) {
      const wards = ((p || {}).stats || {}).wards || [];
      for (const w of wards) {
        if (w == null) continue;
        points.push({
          x: Number(w.positionX),
          y: Number(w.positionY),
          type: Number(w.type),
          time: Number(w.time),
          isRadiant: !!p.isRadiant,
        });
      }
      const pb = (p && p.playbackData) || null;
      const itemEvents =
        pb && Array.isArray(pb.itemUsedEvents) ? pb.itemUsedEvents : [];
      const posEvents =
        pb && Array.isArray(pb.playerUpdatePositionEvents)
          ? pb.playerUpdatePositionEvents
          : [];
      if (itemEvents.length && posEvents.length) {
        const posByTime = new Map();
        for (const ev of posEvents) {
          if (!ev) continue;
          const tt = Number(ev.time);
          if (!Number.isFinite(tt)) continue;
          posByTime.set(tt, { x: Number(ev.x), y: Number(ev.y) });
        }
        for (const it of itemEvents) {
          if (!it) continue;
          if (Number(it.itemId) !== 188) continue;
          const tt = Number(it.time);
          const pos = posByTime.get(tt);
          if (!pos) continue;
          smokes.push({
            x: Number(pos.x),
            y: Number(pos.y),
            time: tt,
            kind: "smoke",
            isRadiant: !!p.isRadiant,
          });
        }
      }
    }
  }

  return { teamLine, filterLine, points, smokes };
}
