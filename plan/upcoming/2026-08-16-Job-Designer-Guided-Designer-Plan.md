# SOF-8023 — Job Designer: Guided Designer Implementation Plan

**Ticket:** [SOF-8023](https://mat3ra.atlassian.net/browse/SOF-8023) — Job Designer UX update:
guided designer flow. Per-phase implementation tickets can be filed under it when work starts.
**Source proposals:** [`UIUX_IMPROVEMENTS.md`](../../UIUX_IMPROVEMENTS.md) (proposals A1–F2) and
the interactive mockups in [`mockups/`](../../mockups/).
**Branch of record for the brainstorm:** `claude/jd-ui-ux-improvements-99w9fg`.
**Prior art:** SOF-7978 extracted the designer into standalone packages; SOF-7991 tracks the
dependency-injection cleanup this plan must not regress.

## Summary

Turn the Job Designer from a five-tab filing cabinet into a guided flow: a readiness rail that
shows what a job still needs, a compute step that answers "what will this cost", a preflight
check at submit, and a live monitor after it. Work is split into three phases so that phase 1
ships inside the current layout with no design sign-off, phase 2 introduces the new layout, and
phase 3 closes the post-submission loop.

## Current state (grounding)

The designer shell is `src/components/Job.jsx` (class component, mixins from `mixwith`):

- Tabs come from `TAB_NAVIGATION_CONFIG` (`@mat3ra/jode`) rendered by cove's `TabsMenu`
  (`variant="fullWidth" centered`); conditional visibility via `conditionalTabsMap`.
- All creation actions live in the "Select Job Actions" dropdown built by
  `Job.jsx#getDefaultActions` (select materials / workflow / parent / dataset, Submit,
  Terminate).
- Tab content wraps injected packages:
  `ComputeTab` → `Compute` from `@mat3ra/ive`; `WorkflowTab` → `Workflow` from
  `@mat3ra/workflow-designer`; `ResultsTab` from `@mat3ra/jove`; `MaterialTab` renders an
  injectable `MaterialViewerComponent`; `FilesTab` renders an injected
  `FilesExplorerContainer`.
- The webapp swaps in its own header and dialogs through `setDependencies()`
  (`src/setDependencies.ts`) and `JobDesignerContext`; the standalone demo
  (`src/standalone/index.tsx`, `npm run dev`, port 3003) exercises the package-native
  fallbacks with standata workflows/materials.

Pain points, verified in the running standalone app (screenshots: [`plan/context/images/`](../context/images/)
and the *Job Designer Next* artifact): the creation path is hidden in the dropdown; numbered
tabs carry no progress or cross-tab context; the compute form shows four required-field errors
on first paint and no cost estimate; the workflow tab duplicates a "Compute" sub-tab, prints
UUIDs and "idle" chips at design time, and renders a light flowchart in the dark shell; there
is no preflight at submit and no live view after it.

## Design language (cove): audit and required work

The platform design language lives in `@mat3ra/cove` (`dist/theme`, `dist/mui`,
`dist/mui-composed`). Audit of the shipped package (2026.7.28-0):

### What exists and is reusable

- Theme pair `LightMaterialUITheme` / `DarkMaterialUITheme`, plus `commonSettings` (Roboto and
  monospace font stacks, button size scale, breakpoints). The default export is still
  `oldLightMaterialUITheme`, which is what the webapp consumes today.
- Palette slots beyond stock MUI: `unitTypes` (execution / condition / assignment / assertion),
  `border`, `icon` — already used by workflow surfaces.
- Primitives the guided designer can reuse directly: `TabsMenu`, `StyledStepper` (linear,
  label-only), `LinearProgress`, dialogs, `Dropdown` / `NestedDropdown`, `RadioGroup`,
  `IconByName` (~370-entry `entities.* / actions.* / shapes.*` map), `ResizableDrawer`,
  `AlertProvider`, and the composed `EntityHeader` / `EntityName` / loading components.

### Defects to fix first (cove PRs; prerequisites for the phases below)

- **`paletteDark` is skeletal**: only `primary`, `secondary`, and the four status colors — no
  `background`, `text`, `action`, `border`, `icon`, or `unitTypes` slots. Anything reading
  `theme.palette.border.main` or `unitTypes.*` in dark mode gets `undefined`. This is the root
  of the light-flowchart-in-dark-shell problem (D4) and the reason the standalone demo rolls
  its own `createTheme` (`src/standalone/index.tsx` `demoTheme`).
- **Status colors are not accessible as shipped**: `success.main` `#72E128` (neon green)
  declares `contrastText #FFFFFF` (~1.6:1 contrast); `error.contrastText` is
  `rgba(0, 0, 0, 0.23)` — 23%-alpha black on red. Chips or badges built on these are
  unreadable. Re-derive the four statuses with passing contrast and add "soft" surface variants
  (tinted background + strong foreground) for chips, badges, and flag rows — the pattern every
  mockup uses.
- **No job-status semantic mapping**: draft / queued / running / finished / error / terminated
  → color + icon currently lives ad hoc in consumers (`iconCls: text-${job.statusCls}`).
  Define the mapping once in cove so the header chip, readiness rail, unit pills, and monitor
  agree.
- **`ButtonMultiSelect` snapshots `buttonConfigs` on mount** and never resyncs (workaround
  documented at length in `Job.jsx#getSaveBtnProps`). Fix the resync in cove, then delete the
  workaround.

### New primitives needed (cove additions; each small and generic)

| Primitive | Used by | Phase |
|-----------|---------|-------|
| `StatusChip` — icon + label pill in status-soft colors | lifecycle header, rail, unit list, queue badges | 1, 3 |
| `CopyId` — truncated id behind a copy icon + tooltip | D2 | 1 |
| `SelectableCard` — radio-behavior card | cluster picker (B1), presets (B3) | 2 |
| `MetricTile` — label + value + unit, tabular numerals | compute summary, estimate panel, results strip | 2, 3 |
| `SegmentedMeter` — used + this-job + remaining | budget/quota display (B2) | 2 |
| `NumericStepperInput` — − value +, min/max, unit suffix | nodes / cores / walltime (B1) | 2 |
| `LifecycleTimeline` — phases with timestamps and states | F2, monitor header | 3 |
| `LogViewer` — monospace, tail-follow, filterable | monitor (F1) | 3 |

### Theme adoption and token bridge

- Promote the current theme pair to the default (deprecate `oldLightMaterialUITheme` behind an
  explicit import), complete `paletteDark`, and switch the standalone demo to
  `DarkMaterialUITheme`, deleting its private `demoTheme` — the demo becomes the dogfood
  surface for the dark palette.
- Export the palette as CSS custom properties from cove's `ThemeProvider` (e.g.
  `--m3-surface`, `--m3-border`, `--m3-status-running`) so non-MUI surfaces — the flowchart
  canvas and unit nodes — consume the same tokens (D4) without importing MUI at render time.
- Typography for data: estimate, logs, ids, and durations use `commonSettings.fonts.monospace`
  and `font-variant-numeric: tabular-nums`; codify this inside the new primitives instead of
  per-app CSS.

## Goals

1. A new job is created left-to-right with visible progress; nothing required hides in a menu.
2. Compute answers cost, limits, and queue wait before submission.
3. Submit runs visible checks; failures deep-link to the fix.
4. A submitted job has a live monitor; the designer stops pretending the job is still a draft.
5. The `setDependencies()` / `JobDesignerContext` injection seam survives every change — the
   webapp must keep working with its own header, dialogs, and file explorer.

## Non-goals

- No redesign of the workflow editing experience itself (unit graph editing, subworkflow
  composition) — that is UX-500 territory.
- No changes to job submission backend contracts; preflight consumes existing data.
- No visual rebrand: the work completes and repairs the existing cove theme system (see the
  design-language section) rather than introducing a new one; the mockups' exact palette is
  illustrative.

## Phase 1 — De-noise (proposals B4, D1, D2, A3)

Low-risk changes inside the current layout. Ship as one PR train; each item independently
revertable.

### 1.1 Progressive validation in the compute form (B4) — `@mat3ra/ive`

- `Compute` renders required-field errors only for touched fields (track touched state per
  field) or after an explicit validate call (used by preflight later, exposed as an imperative
  `validate()` ref or a `showAllErrors` prop).
- Acceptance: opening the Compute tab of a fresh job shows zero red errors; leaving a required
  field empty after focusing it shows exactly one; `showAllErrors` restores today's behavior.

### 1.2 Remove the duplicated Compute sub-tab (D1) — `@mat3ra/workflow-designer`

- The workflow pane's internal tab strip (Overview / Important settings / Detailed view /
  Compute) drops the Compute entry when the host renders its own compute surface. Add a
  `hideComputeSubTab` (default false for backward compatibility) prop; job-designer passes true.
- Acceptance: Workflow tab shows exactly one place named "Compute" across the whole designer.

### 1.3 Humane metadata (D2) — `@mat3ra/workflow-designer` + job-designer

- UUIDs on subworkflow cards and flowchart nodes move behind a copy-id icon with tooltip;
  status chips ("idle") render only when the job has been submitted (`job.isInInitialStatus`
  gates them — job-designer passes the flag; the workflow pane already receives
  `adjustable={job.isInInitialStatus}` so thread one more boolean, e.g. `showUnitStatus`).
- Acceptance: a draft job shows no status chips and no raw UUID text; copy-id copies the id.

### 1.4 First-class Submit in the header (A3) — job-designer + `@mat3ra/cove`

- Submit leaves `getDefaultActions()` and becomes a primary header button next to Save
  (rendered in both header paths: the injected `EntityHeaderComponent` and the standalone
  `EntityHeader` fallback). Disabled state carries a reason string ("compute not configured");
  Terminate replaces it in running states. The dropdown keeps only select-parent and
  import-style power actions.
- Mind the known cove `ButtonMultiSelect` mount-snapshot behavior (see the long note in
  `Job.jsx#getSaveBtnProps`): read state at click time, never capture the entity at render.
- Acceptance: a draft job with material+workflow+compute set can be submitted in one click from
  any tab; the disabled button explains what is missing; webapp header parity is preserved.

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
  dark-palette slot.

## Phase 2 — Guided designer (proposals A1, A2, B1–B3, C1, E1, E2)

The layout change. Mockups: `01-guided-designer.html`, `02-compute-cost.html`,
`03-preflight-submit.html`.

### 2.1 Readiness rail replaces numbered tabs (A1) — job-designer, `@mat3ra/jode`

- New `JobReadinessRail` component (job-designer) renders lifecycle steps — Material, Workflow,
  Compute, Review & Submit (+ Dataset when `workflow.isUsingDataset`; Results, Files after
  submission) — each with state (complete / needs attention / empty) and a one-line selection
  summary. It replaces `TabsMenu` as the designer's navigation; `currentTab` state machine in
  `Job.jsx` stays, only the navigation surface changes.
- Step state derives from a new pure selector module (proposed `src/jobReadiness.ts`):
  `getJobReadiness(job, materials) → { steps: [{ id, state, summary }], isSubmittable,
  blockingReasons }`. Unit-test this module heavily; it also drives the Submit button and
  preflight.
- `TAB_NAVIGATION_CONFIG` (`@mat3ra/jode`) grows optional per-tab step metadata (order, label)
  so webapp and standalone agree on the sequence.
- The three "Select …" dialogs stay as they are, but open from "Change" affordances on their
  steps.
- Layout: rail left (fixed ~260 px, collapses to a horizontal stepper under 760 px — the
  compact variant can extend cove's existing `StyledStepper`), content right. Step state
  renders with cove `StatusChip` colors from the job-status mapping (1.5). Keep the DOM of tab
  panels unchanged where possible so Cypress selectors survive.
- Acceptance: a new user can create and submit a job without opening any dropdown; deep links
  via `getRouteQueryTab` still land on the right step.

### 2.2 Context strip (A2) — job-designer

- New `JobContextStrip` under the header: chips for material (formula · source), workflow
  (name · subworkflow/unit counts), compute (cluster · nodes×cores · walltime), estimate
  (core-hours ≈ cost). Chips navigate to their step; incomplete chips render in the attention
  style. Data comes from the same `getJobReadiness` selector plus the estimate helper (2.3).
- Acceptance: on every step, the other selections stay visible; clicking a chip switches step.

### 2.3 Compute redesign: cluster cards, presets, live estimate (B1–B3) — `@mat3ra/ive`

- Cluster picker becomes selectable cards — cove `SelectableCard` with a `StatusChip` queue
  badge — fed by the existing `clusters` prop; job-designer passes an optional
  `clusterMetadata` enrichment (pricing, limits, queue wait) injected by the webapp through
  `setDependencies()` — standalone falls back to static demo data. Nodes / cores / walltime
  become cove `NumericStepperInput`s with min/max from `clusterMetadata`.
- New `ComputeEstimatePanel` built from cove `MetricTile`s and a `SegmentedMeter` for quota:
  core-hours = nodes × cores × walltime, price, queue ETA, monthly quota. Pure function
  `estimateComputeCost(computeConfiguration, clusterMetadata)` lives beside the panel and is
  unit-tested.
- Presets row (Debug / Standard / Production / same-as-last-job) writes through the normal
  `onUpdate(compute)` path so undo/save semantics are untouched.
- Validation limits (max nodes, cores per node, queue walltime caps) come from
  `clusterMetadata`; violations render inline (not red-on-first-paint — 1.1's touched logic).
- Acceptance: changing any field updates the estimate synchronously; exceeding a limit flags
  the field and the estimate panel; presets fill the form in one click; webapp data path and
  standalone fallback both render.

### 2.4 Preflight at submit (C1) — job-designer (+ webapp data)

- New `PreflightDialog` opened by Submit: runs ordered checks — material set, workflow renders
  (`job.render()` succeeds / template errors empty), compute within `clusterMetadata` limits,
  estimated cost vs. remaining quota. Each check row: pass / warn / fail; fails deep-link to
  the owning step; warns require acknowledge. Submit proceeds only with zero fails and all
  warns acknowledged, then calls the existing `onSubmit` prop.
- Check implementations live in `src/preflight/` as pure async functions
  `runPreflightChecks(job, materials, clusterMetadata, quota) → PreflightReport`, injectable so
  the webapp can add checks (e.g. balance) via `setDependencies()`.
- Acceptance: submitting an incomplete job is impossible through the UI; every fail row's
  action lands on the field that fixes it; checks are unit-tested including the warn/ack flow.

### 2.5 Materials tray and metadata (E1, E2) — job-designer (+ viewer package)

- `MaterialTab` gains a chips tray above the viewer (add / remove / switch — reusing
  `onUpdateIndex`, `onMaterialRemove`, `openAddMaterialsDialog`) and the explicit copy
  "N materials → the workflow runs N times". Multi-material switching stops hiding inside the
  Workflow tab (the workflow pane's switcher stays for parity but the tray is the primary
  affordance).
- Metadata side panel (formula, lattice, space group, atom count, source id) rendered from the
  `Material` model next to the injected viewer; the viewer component API is unchanged.
- Acceptance: adding a second material updates the tray, the batch copy, and the context strip;
  removing the active material selects a sane neighbor.

## Phase 3 — The living job (proposals F1, F2, C2, D3, D4)

Mockup: `04-run-monitor.html`. Mostly lands in dependency packages; job-designer wires props.

### 3.1 Lifecycle header (F2) — `@mat3ra/cove` + job-designer

- Replace the status-colored icon (`iconCls: text-${job.statusCls}`) with cove's
  `LifecycleTimeline` (Draft → Queued → Running → Finished/Error, timestamps on hover),
  colored by the job-status mapping from 1.5. Rendered by the header; state derives from
  existing job status fields.

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

### 3.3 Unit inspector drawer (D3) and theme parity (D4) — `@mat3ra/workflow-designer`

- Clicking a flowchart node opens a right-side drawer — built on cove's existing
  `ResizableDrawer` — with that unit's important settings (replacing the Overview / Important
  settings / Detailed view bounce). Keep the old sub-tabs behind a prop until the webapp
  migrates.
- Flowchart pane colors move to the CSS custom properties exported by cove's `ThemeProvider`
  (design-language section) so the dark shell stops framing a white canvas; `unitTypes.*`
  colors come from the completed dark palette.

## Cross-cutting

- **Injection seam:** every new data need (cluster metadata, quota, log tail, extra preflight
  checks) enters through `setDependencies()` / `JobDesignerContext` with a package-native
  fallback, exactly like `EntityHeaderComponent` and `FilesExplorerContainer` today. No Meteor
  or Redux imports in package code (SOF-7991 direction).
- **Feature flag:** phase 2's layout ships behind a `useGuidedDesigner` flag (webapp-injected
  boolean, default off) so webapp and standalone can flip independently; the legacy tabs path
  remains until parity is verified, then is removed in a cleanup PR.
- **Design language:** all new UI is composed from the cove primitives listed in the
  design-language section — no app-local colors or one-off chips; job statuses always come
  from the cove job-status mapping. New primitives land in cove with gallery entries
  (cove#92 pattern) before consumers use them.
- **Naming:** per `AGENTS.md` — full descriptive names (`JobReadinessRail`,
  `ComputeEstimatePanel`, `runPreflightChecks`), PascalCase components, no abbreviations.
- **Standalone demo as testbed:** every phase must be demonstrable in `npm run dev` with
  standata content and stub metadata; the demo is the review surface for design sign-off.

## Testing

- Unit (node `--test`, `tests/`): `getJobReadiness`, `estimateComputeCost`,
  `runPreflightChecks`, preset application, touched-state validation reducer.
- Component/e2e (Cypress, `tests/e2e`): create-job happy path through the rail; submit blocked
  by a failing preflight then fixed; context-strip navigation; multi-material tray; monitor
  simulation smoke test.
- Regression: webapp integration run (`web-app` Cypress UI suite) before flipping the flag,
  since the webapp injects its own header/dialogs through the seam this plan touches.

## Risks

| Risk | Mitigation |
|------|------------|
| Cluster pricing/limits/queue data may not exist as a clean API | Estimate panel degrades: hide cost/ETA rows when metadata is absent; limits fall back to none |
| `ButtonMultiSelect` mount-snapshot bug class (stale closures in header buttons) | Read `this.state.entity` at click time (pattern already documented in `Job.jsx`); add a regression test |
| Rail layout breaks webapp deep links (`getRouteQueryTab`) | Keep tab ids stable; rail maps ids 1:1 to today's `TAB_NAVIGATION_CONFIG` |
| Cross-repo sequencing (ive / workflow-designer / cove / jove versions) | Land package changes behind additive props with safe defaults; bump versions in job-designer last |
| Dataset-driven jobs (`isUsingDataset`) diverge from the material path | Rail renders a Dataset step in place of Material; readiness selector covers both branches |
| Fixing the status palette recolors screens already shipped on the old values | Land palette fixes as a dedicated cove PR with before/after gallery screenshots and design review; consumers pick the bump explicitly |
| Completing `paletteDark` changes dark-mode rendering of existing cove consumers | Additive slots only (no changes to existing light values); verify against the cove gallery and the standalone demo before releasing |

## Open questions

1. Where do pricing and quota live today — is there an existing accounting endpoint the webapp
   can inject, or is this new backend work? (Blocks the cost half of 2.3; the limits half can
   ship first.)
2. Should preflight warnings (e.g. convergence sanity) come from workflow model metadata or
   stay host-injected only? Package-native heuristics risk false alarms.
3. Does the monitor (3.2) poll job properties or can the webapp provide a push channel? Polling
   is acceptable for v1.
4. File per-phase SOF tickets under SOF-8023 — one per phase, or one per proposal group?
   (Suggest one per phase.)
