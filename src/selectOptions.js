export function buildSelectOptions(matchesIndex, teams, selectedTeamId) {
  const opts = [];
  const t = teams.find((x) => Number(x.id) === Number(selectedTeamId));
  const tName = t?.name || String(selectedTeamId);

  opts.push({ value: `agg:${selectedTeamId}:radiant`, label: `${tName} all 天辉` });
  opts.push({ value: `agg:${selectedTeamId}:dire`, label: `${tName} all 夜魇` });

  const arr = matchesIndex || [];
  const filtered = arr.filter((m) => {
    const r = m.radiantTeamId ?? m.radiant_team_id;
    const d = m.direTeamId ?? m.dire_team_id;
    return Number(r) === Number(selectedTeamId) || Number(d) === Number(selectedTeamId);
  });

  for (const m of filtered) {
    const id = m.match_id ?? m.matchId ?? m.id;
    if (!id) continue;
    const strId = String(id);
    let radName =
      teams.find((x) => Number(x.id) === Number(m.radiantTeamId ?? m.radiant_team_id))?.name || "天辉";
    let direName =
      teams.find((x) => Number(x.id) === Number(m.direTeamId ?? m.dire_team_id))?.name || "夜魇";

    opts.push({ value: strId, label: `${strId} — ${radName} 对 ${direName}` });
  }

  return opts;
}
