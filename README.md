# Dota2 TI14 视野与烟雾可视化

在线预览（GitHub Pages）：

- https://charleshgong.github.io/dota2-ti14-stats/

## 项目简介

这是一个用于分析 Dota 2 比赛中对手“眼位”和“开雾”位置的可视化项目。你可以按战队与阵营（天辉/夜魇）聚合查看所有对局，也可以选择单场比赛，在时间轴上查看当时已生效的守卫与烟雾事件位置。

![示例截图](doc/example.png)

## 数据来源

- 来自 STRATZ 的公开 API：https://stratz.com/api
- 已获取 TI14 决赛日前的所有比赛数据，并以 JSON 文件形式存放于 `matches/` 目录下（例如：`matches/matches.json`、`matches/teams.json`、`matches/{matchId}.json`）。

## 展示规则（当前设置）

- 守卫显示规则：
   - 真眼（Sentry）显示 7 分钟
   - 假眼（Observer）显示 6 分钟
- 烟雾（Smoke of Deceit）事件：在玩家使用烟雾的时间点，标出该时刻的玩家位置，并可选择“仅显示时间窗内事件”或“显示全部烟雾”。

## 主要功能

- 战队与阵营聚合：选择战队后，可一键查看其在天辉或夜魇方的全部对局的守卫与烟雾分布。
- 单场比赛查看：从下拉框中选择具体比赛，查看该场的详细位置分布。
- 时间轴筛选：拖动时间滑条，查看该时刻仍在生效的守卫与对应半径可视范围。
- 数据本地化：直接从 `matches/` 目录读取 JSON 数据，便于离线或静态托管展示。

## 本地开发

本项目使用 React + Vite。

1. 安装依赖：

```bash
npm install
```

2. 启动开发服务器：

```bash
npm run dev
```

3. 打开终端中 Vite 输出的本地地址（通常是 `http://localhost:5173`）。

## 目录与文件说明（节选）

- `src/` 前端代码
   - `App.jsx` 应用入口，负责状态与组件拼装
   - `MapOverlay.jsx` 地图覆盖层渲染（守卫/烟雾）
   - `ControlPanel.jsx` 控制面板（战队/比赛选择、时间轴、烟雾开关）
   - `utils.js` 通用工具与常量
   - `data/loaders.js` 数据装载与解析（比赛/聚合）
   - `selectOptions.js` 比赛下拉框选项构建
- `matches/` 比赛与战队 JSON 数据目录
- `public/` 静态资源目录（地图图片等）

## 备注

- 项目默认从 `matches/teams.json` 读取战队列表，从 `matches/matches.json` 读取可选比赛索引；单场详情从 `matches/{matchId}.json` 读取。
- 如果你在本地新增/替换数据文件，刷新页面即可看到最新结果。

