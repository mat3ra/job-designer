# Job Designer — UI/UX mockups

Interactive, self-contained HTML mockups for the proposals in
[`../UIUX_IMPROVEMENTS.md`](../UIUX_IMPROVEMENTS.md). No build step, no network — open any
file directly in a browser.

| # | File | Shows | Try |
|---|------|-------|-----|
| 01 | `01-guided-designer.html` | Readiness rail, context strip, first-class Submit (A1–A3), materials tray (E1–E2), de-noised workflow list (D2) | Open the **Compute** step and pick a preset — the rail, chips and Submit react. Then submit. |
| 02 | `02-compute-cost.html` | Cluster cards, presets, live cost/quota estimate, progressive validation (B1–B4) | Switch clusters, push cores/walltime past the limits, watch the estimate and flags. |
| 03 | `03-preflight-submit.html` | Preflight checklist with pass / warn / fail, deep-link fixes, submit hand-off (C1–C2) | Let the checks run, click *Fix → set 12 h*, acknowledge the warning, submit. |
| 04 | `04-run-monitor.html` | Live run monitor: lifecycle timeline, per-unit progress, streaming log, convergence chart (F1–F2) | Watch the simulated run; click a unit to filter the log; hover the chart; replay. |

The four files share one set of design tokens (dark shell matching the standalone demo,
`#8b6cf0` accent, reserved status hues always paired with an icon + label) so they read as
one product.
