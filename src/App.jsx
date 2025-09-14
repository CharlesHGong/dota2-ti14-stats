import React, { useEffect, useMemo, useRef, useState } from "react";
import { BASE_MAP_WIDTH, TARGET_TEAM_ID, SMOKE_LIFE, secToClock, filterActive, fetchJSON } from "./utils";
import MapOverlay from "./MapOverlay";
import ControlPanel from "./ControlPanel";
import { loadMatchData, loadAggregateData } from "./data/loaders";
import { buildSelectOptions } from "./selectOptions";

export default function App() {
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const [overlaySize, setOverlaySize] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);

  const [matchesIndex, setMatchesIndex] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(TARGET_TEAM_ID);
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [statusText, setStatusText] = useState("");
  const [teamLine, setTeamLine] = useState("");
  const [filterLine, setFilterLine] = useState("");
  const [selectValue, setSelectValue] = useState("");

  const [allPoints, setAllPoints] = useState([]);
  const [allSmokes, setAllSmokes] = useState([]);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [currentMaxTime, setCurrentMaxTime] = useState(0);
  const [showSmokes, setShowSmokes] = useState(false);

  // Sync overlay size and scale to image
  const syncOverlay = () => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;
    const w = img.clientWidth || img.naturalWidth || 0;
    const h = img.clientHeight || img.naturalHeight || 0;
    setOverlaySize({ w, h });
    const s = Math.max(
      0.25,
      Math.min(2, (w || BASE_MAP_WIDTH) / BASE_MAP_WIDTH)
    );
    setScale(s);
  };

  useEffect(() => {
    syncOverlay();
    const onResize = () => syncOverlay();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Load match list on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let arr = [];
        setStatusText("正在加载列表…");
        try {
          arr = await fetchJSON("matches/matches.json");
        } catch (e) {
          // Keep going; user might rely on preloaded only
          arr = [];
        }
        if (cancelled) return;
        setMatchesIndex(Array.isArray(arr) ? arr : []);
        setStatusText(arr.length ? `已找到 ${arr.length} 场` : "无比赛");
        // Load teams for selection
        try {
          const t = await fetchJSON("matches/teams.json");
          if (!cancelled && Array.isArray(t)) {
            setTeams(t);
            const found =
              t.find((x) => Number(x.id) === Number(TARGET_TEAM_ID)) || t[0];
            if (found) {
              setSelectedTeamId(Number(found.id));
              setSelectedTeamName(found.name || String(found.id));
              setSelectValue(`agg:${found.id}:radiant`);
            }
          }
        } catch (_) {
          // fallback to default id if teams.json not present
          setSelectedTeamId(TARGET_TEAM_ID);
          setSelectedTeamName("");
          setSelectValue(`agg:${TARGET_TEAM_ID}:radiant`);
        }
      } catch (e) {
        if (!cancelled) setStatusText("列表加载失败");
        // eslint-disable-next-line no-console
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // When selectValue changes, load data accordingly
  useEffect(() => {
    if (!selectValue) return;
    // Reset timeline to start when the selection changes
    setCurrentTimeSec(0);
    const isAgg = selectValue.startsWith("agg:");
    if (isAgg) {
      const parts = selectValue.split(":");
      const teamId = Number(parts[1]);
      const side = parts[2] || "radiant";
      (async () => {
        setStatusText("正在加载汇总…");
        try {
          const { teamLine: tl, filterLine: fl, points, smokes } =
            await loadAggregateData(side, teamId, teams, matchesIndex);
          setTeamLine(tl);
          setFilterLine(fl);
          setAllPoints(points);
          setAllSmokes(smokes);
        } catch (e) {
          setStatusText("汇总加载失败");
          // eslint-disable-next-line no-console
          console.error(e);
        }
      })();
    } else {
      (async () => {
        setStatusText(`正在加载 ${selectValue}…`);
        try {
          const { teamLine: tl, filterLine: fl, points, smokes } =
            await loadMatchData(selectValue, selectedTeamId);
          setTeamLine(tl);
          setFilterLine(fl);
          setAllPoints(points);
          setAllSmokes(smokes);
        } catch (e) {
          setStatusText("比赛加载失败");
          // eslint-disable-next-line no-console
          console.error(e);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectValue]);

  // Recompute time-bounded status when time or points change
  const activePoints = useMemo(
    () => filterActive(allPoints, currentTimeSec),
    [allPoints, currentTimeSec]
  );
  const visiblePoints = activePoints; // wards only
  const activeSmokes = useMemo(
    () =>
      allSmokes.filter(
        (p) => p.time <= currentTimeSec && currentTimeSec < p.time + SMOKE_LIFE
      ),
    [allSmokes, currentTimeSec]
  );
  useEffect(() => {
    setStatusText(
      `${activePoints.length} 个守卫 @ ${secToClock(
        currentTimeSec
      )}（最大 ${secToClock(currentMaxTime)}）`
    );
  }, [activePoints.length, currentTimeSec, currentMaxTime]);

  // Update slider bounds when points change
  useEffect(() => {
    const maxT = allPoints.length
      ? Math.max(...allPoints.map((p) => p.time || 0))
      : 0;
    setCurrentMaxTime(maxT);
    if (currentTimeSec > maxT) setCurrentTimeSec(maxT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPoints]);

  // removed in-file load functions; now using loaders in ./data/loaders

  // Build match select options whenever inputs change
  const selectOptions = useMemo(
    () => buildSelectOptions(matchesIndex, teams, selectedTeamId),
    [matchesIndex, teams, selectedTeamId]
  );

  // Derived styles
  const containerStyle = useMemo(
    () => ({
      position: "relative",
      display: "block",
      width: "100%",
      maxWidth: 800,
      margin: "0 auto",
      "--scale": String(scale),
    }),
    [scale]
  );

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        background: "#111",
        minHeight: "100vh",
        color: "#fff",
        margin: 0,
        padding: 0,
      }}
    >
      <ControlPanel
        teams={teams}
        selectedTeamId={selectedTeamId}
        setSelectedTeamId={setSelectedTeamId}
        setSelectedTeamName={setSelectedTeamName}
        setSelectValue={setSelectValue}
        statusText={statusText}
        selectOptions={selectOptions}
        selectValue={selectValue}
        teamLine={teamLine}
        filterLine={filterLine}
        allSmokes={allSmokes}
        currentMaxTime={currentMaxTime}
        currentTimeSec={currentTimeSec}
        currentTimeLabel={secToClock(currentTimeSec)}
        setCurrentTimeSec={setCurrentTimeSec}
        showSmokes={showSmokes}
        setShowSmokes={setShowSmokes}
      />
      <div ref={containerRef} style={containerStyle}>
        <img
          ref={imgRef}
          id="dota-map"
          src={`${import.meta.env.BASE_URL}dota2_map.jpg`}
          alt="Dota 2 Map"
          style={{ display: "block", width: "100%", height: "auto" }}
          onLoad={syncOverlay}
        />
        <MapOverlay
          overlaySize={overlaySize}
          scale={scale}
          visiblePoints={visiblePoints}
          allSmokes={allSmokes}
          activeSmokes={activeSmokes}
          showSmokes={showSmokes}
        />
      </div>
    </div>
  );
}
