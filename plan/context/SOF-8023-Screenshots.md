# SOF-8023 — Screenshots: current state and mockups

Reference images for [`../upcoming/SOF-8023-Job-Designer-Guided-Designer-Plan.md`](../upcoming/SOF-8023-Job-Designer-Guided-Designer-Plan.md).
Current-state captures come from the standalone demo (`npm run dev`, standata content,
2026-08-15); mockup captures come from the interactive files in [`mockups/`](../../mockups/).
Stored via Git LFS (`*.png`, see `.gitattributes`).

## Current state

| | |
|---|---|
| ![Materials tab](images/sof-8023-current-materials-tab.png) | **Materials tab** — full-bleed 3D viewer, no metadata panel, no multi-material tray. |
| ![Workflow tab](images/sof-8023-current-workflow-tab.png) | **Workflow tab** — UUIDs and "idle" chips at design time, duplicated "Compute" sub-tab, light flowchart pane inside the dark shell. |
| ![Compute tab](images/sof-8023-current-compute-tab.png) | **Compute tab** — four required-field errors on first paint; bare selects; no cost, limits, or queue information. |
| ![Actions dropdown](images/sof-8023-current-actions-dropdown.png) | **"Select Job Actions" dropdown** — the entire creation path (and, in the webapp, Submit) hides here. |

## Mockups

| | |
|---|---|
| ![Guided designer](images/sof-8023-mockup-01-guided-designer.png) | **01 · Guided designer** — readiness rail, context strip, first-class Submit (proposals A1–A3, D2, E1–E2). |
| ![Compute and cost](images/sof-8023-mockup-02-compute-cost.png) | **02 · Compute & cost** — cluster cards, presets, live estimate with quota meter, progressive validation (B1–B4). |
| ![Preflight](images/sof-8023-mockup-03-preflight-submit.png) | **03 · Preflight & submit** — pass/warn/fail checks with deep-link fixes (C1–C2). |
| ![Run monitor](images/sof-8023-mockup-04-run-monitor.png) | **04 · Run monitor** — lifecycle timeline, per-unit progress, log tail, convergence chart (F1–F2). |
