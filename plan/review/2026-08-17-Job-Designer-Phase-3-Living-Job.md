# Job Designer Phase 3 — The Living Job

- **Ticket:** [SOF-8023](https://mat3ra.atlassian.net/browse/SOF-8023) — Job Designer UX update.
- **Parent:** [../upcoming/2026-08-16-Job-Designer-Guided-Designer-Plan.md](../upcoming/2026-08-16-Job-Designer-Guided-Designer-Plan.md)
  (overview, current state, cove design-language audit, cross-cutting concerns).
- **Status:** built and on branches — every item below is implemented and in review.
  Nothing merged yet, so this document sits in `review/` rather than `implemented/`.
- **Created:** 2026-08-16 · **Updated:** 2026-08-17

## Status — what shipped

| Item | Where | PR / branch |
|------|-------|----|
| 3.1 Lifecycle header | `@mat3ra/cove` + job-designer | [cove#97](https://github.com/mat3ra/cove/pull/97), [job-designer#19](https://github.com/mat3ra/job-designer/pull/19) |
| 3.2 Run monitor | `@mat3ra/jove` + `@mat3ra/cove` + job-designer | `mat3ra/jove@feature/SOF-8023-run-monitor`, [cove#97](https://github.com/mat3ra/cove/pull/97), [job-designer#19](https://github.com/mat3ra/job-designer/pull/19) |
| 3.3 Unit inspector + theme parity | `@mat3ra/workflow-designer` + `@mat3ra/wove` + job-designer | [workflow-designer#13](https://github.com/mat3ra/workflow-designer/pull/13), [wove#11](https://github.com/mat3ra/wove/pull/11), [job-designer#19](https://github.com/mat3ra/job-designer/pull/19) |

Everything is behind the same opt-in flags as phase 2 — `useGuidedDesigner`,
`useUnitInspector`, `useHostTheme`, `showRunMonitor` — defaulted off for hosts and on in the
standalone demos.

Measured in the running demos: a draft's header reads
`Draft[current] → Queued[upcoming] → Running[upcoming] → Finished[upcoming]`, and a running
job's `Draft[done] → Queued[done] → Running[current]`, with the rail swapping *Review &
submit* for *Monitor · Running* and *Files* and the Submit button disappearing. jove's
simulated run reports `1/5 finished`, `22s elapsed`, a unit at `10s so far`, and a log tail
that grows. Clicking a flowchart unit opens a drawer titled *cp · Unit 1 · execution*
carrying that unit's dynamics parameters. Under a dark host the flowchart pane is now
`#0d1117` with white control glyphs and visible grid dots — previously white, black-on-white,
and pure black.

### Divergences from the plan as written

- **3.3's drawer is not built on cove's `ResizableDrawer`.** That component is anchored to
  the bottom and resizes on height only — its hook takes a `minHeight`, its buttons are up
  and down arrows. Generalising it to two axes is a change to a shared component with its
  own consumers; the width handle in `UnitInspectorDrawer` is a few lines and puts none of
  them at risk.
- **The white canvas was not mainly the flowchart's colours.** Fixing those was necessary
  but not sufficient: `WorkflowDefaultLayout` pinned the *entire designer* to
  `oldLightMaterialUITheme`, so the subtree was light no matter what the shell did. The real
  fix is `useHostTheme`, which skips that override. The flowchart's own hard-coded colours
  are fixed too — including a background-dot colour set to the literal string `"000"`, not a
  valid CSS colour, which fell back to reactflow's light default and vanished on dark.
- **3.1 dropped the status tint rather than keeping it alongside.** The plan said "replace";
  the timeline states the status better than a tinted glyph, and two statements of the same
  fact in one header is one too many. The WorkflowTab's own `iconCls` is a separate surface
  and is untouched.
- **The lifecycle timeline distinguishes five stage states, not four.** Beyond done /
  current / upcoming there is **failed** — the last stage becomes the failure itself, named
  for what happened ("Terminated", "Timed out"), not a finish that never came — and
  **skipped**, for stages the job never reached. "Upcoming" on a terminated job would
  suggest it might still run.
- **3.2's log viewer is a new cove primitive.** The plan named a `LogViewer` without saying
  where it lived; it is in cove, per the cross-cutting rule that new primitives land there
  first. It follows the tail until the reader scrolls up, then stops and offers to resume.
- **3.2's navigation fires on the status transition, not on the submit click.** Switching at
  the click would land the reader on a Results tab that `conditionalTabsMap` has not enabled
  yet, because the job is still `pre-submission` until the server says otherwise.
- **The convergence chart was not rebuilt.** `ConvergenceChart` already exists in jove and
  renders from job properties; the monitor shows units, durations and the log, and leaves the
  chart where it is. Restyling it with cove tokens is not done.

### Still open

- **The webapp data adapter — half of 3.2, as the plan predicted.** Nothing publishes a log
  tail. `getJobLogTail` is read from `setDependencies()`; without it the monitor says the
  deployment provides no log feed rather than showing an empty box that reads as a silent
  job. Unit status tracks come from the job document and need no new endpoint.
- **Per-unit progress within a unit.** The monitor reports which units are running and for
  how long, not how far through its own iterations a unit is. That needs the convergence
  stream, which is the same data the chart uses.
- **Release ordering, now four deep.** cove → wove → ive / workflow-designer / jove →
  job-designer. jove is newly in the train: `RunMonitor` imports cove's `LogViewer`,
  `MetricTile` and `SegmentedMeter`.
- **Two pre-existing breakages were fixed in passing** and are worth knowing about:
  workflow-designer's unit tests never ran (16/16 failed on `main` — the tests import the
  package by its own name and nothing resolved it; one `tsconfig` `paths` entry fixes it),
  and jove's `npm run lint` failed on a prettier violation predating this work.

## Phase 3 — The living job (proposals F1, F2, C2, D3, D4)

Mockup: `04-run-monitor.html`. Mostly lands in dependency packages; job-designer wires props.

### 3.1 Lifecycle header (F2) — `@mat3ra/cove` + job-designer

- Replace the status-colored icon (`iconCls: text-${job.statusCls}`) with cove's
  `LifecycleTimeline` (Draft → Queued → Running → Finished/Error, timestamps on hover),
  colored by the job-status mapping from 1.5. Rendered by the header; state derives from
  existing job status fields. Size: S–M.
- **Built** — cove's `LifecycleTimeline` / `JobLifecycleTimeline` (pure `getLifecycleStages`,
  15 unit tests) rendered by both of job-designer's header paths.

### 3.2 Run monitor (F1, C2) — `@mat3ra/jove` + webapp

- `ResultsTab` grows a monitor mode while the job is active: per-unit list with `StatusChip`
  states, durations, and progress; a cove `LogViewer` tail; convergence chart streaming from
  the existing property update channel (`onOutputUpdateRequest` / job properties refresh),
  drawn with cove tokens (single series, recessive grid, emphasized endpoint). On finish it
  settles into today's results view with a `MetricTile` summary strip.
- After a successful preflight submit (2.4), the designer navigates to the monitor instead of
  staying on the editing view (C2).
- Data contract needs webapp work (log tail endpoint or polling adapter injected via
  `setDependencies()`); standalone ships a simulated feed for the demo, mirroring the mockup.
  Size: L–XL (the largest single item; the webapp data adapter is half of it).
- **Built** — jove's `src/runMonitor.ts` (25 unit tests) and `RunMonitor`, behind
  `ResultsTab`'s `showRunMonitor`; cove's `LogViewer`; job-designer navigates on the status
  transition and feeds units and the log through. The webapp adapter is still missing, as the
  plan expected, and the monitor says so rather than implying a silent job.

### 3.3 Unit inspector drawer (D3) and theme parity (D4) — `@mat3ra/workflow-designer`

- Clicking a flowchart node opens a right-side drawer — built on cove's existing
  `ResizableDrawer` — with that unit's important settings (replacing the Overview / Important
  settings / Detailed view bounce). Keep the old sub-tabs behind a prop until the webapp
  migrates.
- Flowchart pane colors move to the CSS custom properties exported by cove's `ThemeProvider`
  (design-language section) so the dark shell stops framing a white canvas; `unitTypes.*`
  colors come from the completed dark palette.
- Size: M–L.
- **Built** — workflow-designer's `UnitInspectorDrawer` behind `useUnitInspector`, and
  `useHostTheme` to stop the designer pinning itself to a light theme; wove's flowchart takes
  its pane, control, edge and grid colours from the theme.
