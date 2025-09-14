import React from "react";
import { worldToMap, secToClock } from "./utils";

export default function MapOverlay({
  overlaySize,
  scale,
  visiblePoints,
  allSmokes,
  activeSmokes,
  showSmokes,
}) {
  const overlayStyle = {
    position: "absolute",
    left: 0,
    top: 0,
    width: overlaySize.w,
    height: overlaySize.h,
    pointerEvents: "none",
  };

  return (
    <div id="overlay" style={overlayStyle}>
      {visiblePoints.map((pt, i) => {
        const [mx, my] = worldToMap(pt.x, pt.y, overlaySize.w, overlaySize.h);
        const commonStyle = {
          position: "absolute",
          left: mx,
          top: my,
          transform: "translate(-50%, -50%)",
        };
        return (
          <React.Fragment key={i}>
            {pt.type === 0 && (
              <div
                className="ward-radius"
                style={{
                  ...commonStyle,
                  width: `calc(130px * var(--scale))`,
                  height: `calc(130px * var(--scale))`,
                  borderRadius: "50%",
                  background: "rgba(255, 214, 0, 0.18)",
                  border: "1px solid rgba(255, 214, 0, 0.6)",
                }}
              />
            )}
            {pt.type === 0 && (
              <div
                className="ward-time"
                style={{
                  ...commonStyle,
                  color: "#FFD600",
                  fontWeight: 700,
                  fontSize: "calc(11px * var(--scale))",
                  textShadow: "0 2px 4px rgba(0,0,0,0.85)",
                  zIndex: 3,
                }}
              >
                {secToClock(pt.time)}
              </div>
            )}
            <div
              className="ward-dot"
              style={{
                ...commonStyle,
                width: `calc(10px * var(--scale))`,
                height: `calc(10px * var(--scale))`,
                borderRadius: "50%",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.7)",
                background: pt.type === 0 ? "#FFD600" : "#2979FF",
                zIndex: 2,
              }}
            />
          </React.Fragment>
        );
      })}
      {(showSmokes ? allSmokes : activeSmokes).map((pt, i) => {
        const [mx, my] = worldToMap(pt.x, pt.y, overlaySize.w, overlaySize.h);
        const commonStyle = {
          position: "absolute",
          left: mx,
          top: my,
          transform: "translate(-50%, -50%)",
        };
        return (
          <React.Fragment key={`smoke-${i}`}>
            <div
              className="smoke-radius"
              style={{
                ...commonStyle,
                width: `calc(100px * var(--scale))`,
                height: `calc(100px * var(--scale))`,
                borderRadius: "50%",
                background: "rgba(191, 0, 255, 0.45)",
                border: "2px solid rgba(191, 0, 255, 0.9)",
                boxShadow: "0 0 18px 6px rgba(191, 0, 255, 0.6)",
                zIndex: 2,
              }}
            />
            <div
              className="smoke-time"
              style={{
                ...commonStyle,
                color: "#fff",
                fontWeight: 700,
                fontSize: "calc(11px * var(--scale))",
                textShadow:
                  "0 2px 4px rgba(0,0,0,0.85), 0 0 8px rgba(191,0,255,0.9)",
                zIndex: 4,
              }}
            >
              {secToClock(pt.time)}
            </div>
            <div
              className="smoke-dot"
              style={{
                ...commonStyle,
                width: `calc(10px * var(--scale))`,
                height: `calc(10px * var(--scale))`,
                borderRadius: "50%",
                boxShadow:
                  "0 0 0 1px rgba(0,0,0,0.7), 0 0 12px 4px rgba(191, 0, 255, 0.8)",
                background: "#BF00FF",
                zIndex: 3,
              }}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}
