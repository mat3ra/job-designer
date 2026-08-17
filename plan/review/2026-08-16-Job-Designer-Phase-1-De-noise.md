# Job Designer Phase 1 — De-noise

- **Ticket:** [SOF-8023](https://mat3ra.atlassian.net/browse/SOF-8023) — Job Designer UX update.
- **Parent:** [../upcoming/2026-08-16-Job-Designer-Guided-Designer-Plan.md](../upcoming/2026-08-16-Job-Designer-Guided-Designer-Plan.md)
  (overview, current state, cove design-language audit, cross-cutting concerns).
- **Status:** built and on branches — every item below is implemented and in review.
  Nothing merged yet, so this document sits in `review/` rather than `implemented/`.
- **Created:** 2026-08-16 · **Updated:** 2026-08-16

## Status — what shipped

| Item | Where | PR |
|------|-------|----|
| 1.1 Progressive validation | `@mat3ra/ive` | [ive#6](https://github.com/mat3ra/ive/pull/6) |
| 1.2 Single Compute tab | `@mat3ra/workflow-designer` + job-designer | [workflow-designer#13](https://github.com/mat3ra/workflow-designer/pull/13), [job-designer#19](https://github.com/mat3ra/job-designer/pull/19) |
| 1.3 Humane metadata | `@mat3ra/wove` + `@mat3ra/workflow-designer` | [wove#11](https://github.com/mat3ra/wove/pull/11), [workflow-designer#14](https://github.com/mat3ra/workflow-designer/pull/14) |
| 1.4 First-class Submit | job-designer | [job-designer#19](https://github.com/mat3ra/job-designer/pull/19) |
| 1.5 Design-language groundwork | `@mat3ra/cove` | [cove#97](https://github.com/mat3ra/cove/pull/97) |
| 1.6 Visible error state | job-designer | [job-designer#19](https://github.com/mat3ra/job-designer/pull/19) |

Measured in the standalone demo with all package changes linked together: required-field
errors on a fresh Compute tab **4 → 0**; things labelled "Compute" on the Workflow tab
**2 → 1**; flowchart ids visible **8 → 0**; Submit moved from a dropdown item that
disappeared when unavailable to a header button that names what is missing.

### Divergences from the plan as written

- **1.3 landed in `@mat3ra/wove`, not `@mat3ra/workflow-designer`.** The ids and status
  chips render in wove's `components/common/CardHeader` (used by `UnitCard` and
  `WorkflowUnitCard`), traced from the rendered DOM. The plan had assigned it to
  workflow-designer.
- **1.3's mechanism changed twice.** The plan proposed folding ids behind cove's `CopyId`.
  It shipped instead as *hidden by default* with a **"Developer info"** toggle — the
  approach the parallel SOF-8024 effort had specified (its items 1.1 and 1.5), adopted so
  the two projects do not answer the same question differently. And it reaches wove through
  a new `WoveDisplayOptionsProvider` context rather than props, because the flowchart cards
  sit behind reactflow node data (`UnitsFlowchartContainer → UnitsFlowchart → node.data →
  UnitNode → UnitCard`) where prop-drilling is not practical.
- **The cove defects were worse than audited.** `paletteDark` was not "identical to light"
  but *missing* `background` / `text` / `action` / `border` / `icon` / `unitTypes`
  entirely, so those read `undefined` in dark mode. Status `contrastText` values were
  unusable (white on neon green at 1.7:1; `rgba(0, 0, 0, 0.23)` on red). Fixed with values
  computed and asserted by `tests/palette.tests.ts`, not chosen by eye.
- **An unplanned prerequisite: the build output was never being committed.** `dist/` is
  tracked and shipped by these packages, but the husky `pre-commit` hook that regenerates
  it had never run — husky was not a dependency and no `prepare` script installed it. Four
  packages had landed src changes with stale or entirely absent `dist`, including new
  modules whose emitted code imported files that were never built. Fixed per repo, and
  recorded in `AGENTS.md` §1.7.1.
- **1.4 needed a `shouldComponentUpdate` change** that the plan did not anticipate: the
  component's mixins only consider the job entity, so the terminate confirmation could
  never have rendered without it.

### Still open

- Nothing from Phase 1 is unimplemented. The remaining work is review and the release
  order recorded in the parent plan (cove → wove → ive / workflow-designer → job-designer).
- Phase 2 has since been built on the same branches; see
  [`2026-08-17-Job-Designer-Phase-2-Guided-Designer.md`](2026-08-17-Job-Designer-Phase-2-Guided-Designer.md).
  It adds four cove primitives and new ive components to the same release train, so the
  order above now matters more, not less: ive's compute redesign will not render against a
  cove that predates them.

## Phase 1 — De-noise (proposals B4, D1, D2, A3)

Low-risk changes inside the current layout. Ship as one PR train; each item independently
revertable.

### 1.1 Progressive validation in the compute form (B4) — `@mat3ra/ive`

- `Compute` renders required-field errors only for touched fields (track touched state per
  field) or after an explicit validate call (used by preflight later, exposed as an imperative
  `validate()` ref or a `showAllErrors` prop).
- Acceptance: opening the Compute tab of a fresh job shows zero red errors; leaving a required
  field empty after focusing it shows exactly one; `showAllErrors` restores today's behavior.
  Size: S–M.

### 1.2 Remove the duplicated Compute sub-tab (D1) — `@mat3ra/workflow-designer`

- The workflow pane's internal tab strip (Overview / Important settings / Detailed view /
  Compute) drops the Compute entry when the host renders its own compute surface. Add a
  `hideComputeSubTab` (default false for backward compatibility) prop; job-designer passes true.
- Acceptance: Workflow tab shows exactly one place named "Compute" across the whole designer.
  Size: S.

### 1.3 Humane metadata (D2) — `@mat3ra/wove` + job-designer

> **Correction (2026-08-16, during implementation):** this was scoped to
> `@mat3ra/workflow-designer`. It is not there. The UUIDs and "idle" chips render in
> **`@mat3ra/wove`** — `components/common/CardHeader`, `components/units/UnitCard`,
> `components/workflows/WorkflowUnitCard` — which draws the subworkflow cards and flowchart
> nodes as MUI `Card`s with the id as `CardHeader` subheader and the status as a `Chip` in the
> title. Found by tracing the rendered DOM in the running job-designer demo.

- UUIDs on subworkflow cards and flowchart nodes move behind cove's `CopyId`; status chips
  render only when the job has been submitted (job-designer passes the flag; the workflow pane
  already receives `adjustable={job.isInInitialStatus}`, so thread one more boolean, e.g.
  `showUnitStatus`, through `workflow-designer` into wove).
- **Blocked on** the cove release (1.5) — `CopyId` and `StatusChip` must be published first.
- Acceptance: a draft job shows no status chips and no raw UUID text; copy-id copies the id.
  Size: M.

### 1.4 First-class Submit in the header (A3) — job-designer + `@mat3ra/cove`

- Submit leaves `getDefaultActions()` and becomes a primary header button next to Save
  (rendered in both header paths: the injected `EntityHeaderComponent` and the standalone
  `EntityHeader` fallback). Disabled state carries a reason string ("compute not configured");
  Terminate replaces it in running states. The dropdown keeps only select-parent and
  import-style power actions.
- Mind the known cove `ButtonMultiSelect` mount-snapshot behavior (see the long note in
  `Job.jsx#getSaveBtnProps`): read state at click time, never capture the entity at render.
- Terminate is destructive: it gets a confirm step (job name + elapsed time in the dialog),
  unlike today's straight dropdown action.
- Acceptance: a draft job with material+workflow+compute set can be submitted in one click from
  any tab; the disabled button explains what is missing; Terminate asks before killing a run;
  webapp header parity is preserved. Size: M.

### 1.5 Design-language groundwork (cove)

- Fix the status palette (contrast + soft variants) and ship `StatusChip` and `CopyId`;
  complete the missing `paletteDark` slots (`background`, `text`, `action`, `border`, `icon`,
  `unitTypes`).
- Export the job-status semantic mapping (draft / queued / running / finished / error /
  terminated → color + icon) from cove; items 1.3 and 1.4 consume it instead of
  `text-${job.statusCls}` classes.
- Fix `ButtonMultiSelect` config resync; delete the click-time-read workaround note in
  `Job.jsx` once the fixed version is consumed.
- Switch the standalone demo to cove's `DarkMaterialUITheme` (delete `demoTheme` in
  `src/standalone/index.tsx`) so the completed dark palette is exercised continuously.
- Acceptance: chips and header render legibly in both themes (visual check in the cove
  gallery, cove#92); the demo runs without a private theme; no consumer reads an undefined
  dark-palette slot. Size: M–L.

### 1.6 Visible error state (new; not in the original proposals)

- `Job.jsx` wraps the designer in `ErrorBoundary` with `fallback={<div />}` — a render crash
  currently produces a silently blank page. Replace with a visible error card (what failed, a
  reload affordance, and a copyable error digest); the webapp can inject its reporting hook
  through the seam.
- Acceptance: a thrown render error shows the error card in both webapp and standalone; the
  fallback never renders an empty page. Size: S.
