import React from "react";

export default function ControlPanel({
  teams,
  selectedTeamId,
  setSelectedTeamId,
  setSelectedTeamName,
  setSelectValue,
  statusText,
  selectOptions,
  selectValue,
  teamLine,
  filterLine,
  allSmokes,
  currentMaxTime,
  currentTimeSec,
  currentTimeLabel,
  setCurrentTimeSec,
  showSmokes,
  setShowSmokes,
}) {
  return (
    <div
      className="control-panel"
      style={{
        position: "static",
        margin: "12px auto 10px",
        width: "100%",
        maxWidth: 800,
        background: "rgba(0,0,0,0.75)",
        color: "#fff",
        padding: "8px 10px",
        borderRadius: 6,
        fontSize: 14,
      }}
    >
      <div className="cp-row">
        <label htmlFor="team-select">战队：</label>
        <select
          id="team-select"
          value={selectedTeamId}
          onChange={(e) => {
            const id = Number(e.target.value);
            setSelectedTeamId(id);
            const t = teams.find((x) => Number(x.id) === id);
            setSelectedTeamName(t?.name || String(id));
            setSelectValue(`agg:${id}:radiant`);
          }}
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.id})
            </option>
          ))}
        </select>
        <span style={{ opacity: 0.8 }}>{statusText}</span>
      </div>
      <div style={{ marginTop: 8 }}>
        <label htmlFor="match-select">比赛：</label>
        <select
          id="match-select"
          style={{ marginLeft: 6, minWidth: '60%' }}
          value={selectValue}
          onChange={(e) => setSelectValue(e.target.value)}
        >
          {selectOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginTop: 8, fontWeight: 600, opacity: 0.95 }}>
        {teamLine}
      </div>
      <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>
        {filterLine}
      </div>
      <div style={{ marginTop: 4, fontSize: 12, opacity: 0.9 }}>
        烟雾总数：{allSmokes.length}
      </div>
      <div className="cp-row">
        <label htmlFor="time-range" style={{ opacity: 0.9 }}>
          时间：
        </label>
        <input
          id="time-range"
          type="range"
          min={-60}
          max={currentMaxTime}
          value={currentTimeSec}
          step={1}
          onChange={(e) => setCurrentTimeSec(Number(e.target.value))}
        />
  <span style={{ minWidth: 64, textAlign: "right", opacity: 0.9 }}>{currentTimeLabel}</span>
        <button
          type="button"
          onClick={() => setShowSmokes((s) => !s)}
          style={{
            marginLeft: 10,
            padding: "4px 8px",
            background: showSmokes ? "#BF00FF" : "#333",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          {showSmokes ? "仅在事件中显示烟雾" : "显示所有烟雾"}
        </button>
      </div>
    </div>
  );
}
