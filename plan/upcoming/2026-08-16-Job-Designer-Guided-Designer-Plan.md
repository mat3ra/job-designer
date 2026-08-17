# SOF-8023 — Job Designer: Guided Designer Implementation Plan

**Ticket:** [SOF-8023](https://mat3ra.atlassian.net/browse/SOF-8023) — Job Designer UX update:
guided designer flow. Per-phase implementation tickets can be filed under it when work starts.
**Source proposals:** [`UIUX_IMPROVEMENTS.md`](../../UIUX_IMPROVEMENTS.md) (proposals A1–F2) and
the interactive mockups in [`mockups/`](../../mockups/).
**Branch of record for the brainstorm:** `claude/jd-ui-ux-improvements-99w9fg`.
**Prior art:** SOF-7978 extracted the designer into standalone packages; SOF-7991 tracks the
dependency-injection cleanup this plan must not regress.
**Parallel effort:** [SOF-8024](https://mat3ra.atlassian.net/browse/SOF-8024) is the same
exercise for the *workflow* designer ([workflow-designer#12](https://github.com/mat3ra/workflow-designer/pull/12),
six portion documents in that repo's `plan/`). The two overlap in three places, so treat its
documents as authoritative for those: its **portion 2** covers the cove design language this
plan's §"Design language" opens (cove#97 implements the semantic and dark-palette half); its
**portion 1 items 1.1/1.5** are this plan's item 1.3; and its **portion 3** covers the
`@mat3ra/ive` compute form that phase 2.3 rebuilds. Coordinate before starting any of those.

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
  `background`, `text`, `action`, `border`, `icon`, or `unitTypes` slots. (Worth stating
  precisely, because the parallel SOF-8024 audit records it as "light and dark are identical":
  they are not. MUI backfills its own standard slots, so dark *looks* like stock-MUI dark, but
  the custom slots resolve to `undefined` — which is exactly why wove cannot read
  `unitTypes.*` in dark mode.) Anything reading
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

## Phase 1 — De-noise (moved)

Built and in review. Its items, what actually shipped, and the divergences from this plan
are recorded in
[`../review/2026-08-16-Job-Designer-Phase-1-De-noise.md`](../review/2026-08-16-Job-Designer-Phase-1-De-noise.md).

Phases are split across documents so each can move through `plan/` independently, as the
folder's own convention asks — this overview moves last.
## Phase 2 — Guided designer (moved)

Built and in review. Its items, what actually shipped, and the divergences from this plan
are recorded in
[`../review/2026-08-17-Job-Designer-Phase-2-Guided-Designer.md`](../review/2026-08-17-Job-Designer-Phase-2-Guided-Designer.md).

## Phase 3 — The living job (proposals F1, F2, C2, D3, D4)

Mockup: `04-run-monitor.html`. Mostly lands in dependency packages; job-designer wires props.

### 3.1 Lifecycle header (F2) — `@mat3ra/cove` + job-designer

- Replace the status-colored icon (`iconCls: text-${job.statusCls}`) with cove's
  `LifecycleTimeline` (Draft → Queued → Running → Finished/Error, timestamps on hover),
  colored by the job-status mapping from 1.5. Rendered by the header; state derives from
  existing job status fields. Size: S–M.

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

### 3.3 Unit inspector drawer (D3) and theme parity (D4) — `@mat3ra/workflow-designer`

- Clicking a flowchart node opens a right-side drawer — built on cove's existing
  `ResizableDrawer` — with that unit's important settings (replacing the Overview / Important
  settings / Detailed view bounce). Keep the old sub-tabs behind a prop until the webapp
  migrates.
- Flowchart pane colors move to the CSS custom properties exported by cove's `ThemeProvider`
  (design-language section) so the dark shell stops framing a white canvas; `unitTypes.*`
  colors come from the completed dark palette.
- Size: M–L.

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
- **Performance guardrail:** `Job.jsx` has delicate update machinery — `shouldComponentUpdate`
  mixins, `renderGeneration`, and `persistJob()` runs `job.render()` (template rendering) on
  workflow-tab entry. Readiness and estimate recomputation must be memoized pure derivation
  that never calls `persistJob` or bumps `renderGeneration`; a compute keystroke must not
  trigger a workflow re-render. Add a regression test that counts `job.render()` calls during
  compute edits.
- **Accessibility:** rail and dialogs are keyboard-operable (focus trap in `PreflightDialog`,
  `aria-current` on the active step, visible focus states); status is never conveyed by color
  alone (icons + labels on every `StatusChip`); the palette work in 1.5 fixes the contrast
  side.
- **Localization:** the webapp localizes via TAPi18n (stubbed as `createMessageTextTAPi18n` in
  `Job.jsx`); new user-facing strings (readiness summaries, preflight messages, save-state
  copy) go through an injectable message resolver on the seam with English fallbacks — no
  hard-coded strings scattered through components.
- **Shared with the Materials Designer effort:** the cove primitives and palette repairs in
  1.5 serve the parallel materials-designer UX update too — keep primitive APIs generic (no
  job-specific props) and land cove work first so both designers consume the same release.

### Release sequencing

Additive props with safe defaults everywhere, so no lockstep release is required. Order:

1. `cove` (1.5, palette + primitives) — everything else consumes it.
2. `ive` (1.1, 2.3), `workflow-designer` (1.2, 1.3, 3.3), `jove` (3.2) — in parallel, each
   behind default-off props.
3. ~~`jode` (2.1 step metadata)~~ — not needed; the rail derives its sequence from the
   readiness selector and reuses the existing tab ids. jode is untouched.
4. `job-designer` — version bumps + the shell work (1.4, 1.6, 2.1, 2.2, 2.4, 2.5, 2.6),
   verified in the standalone demo. Its `src/computeEstimate.ts` is a stand-in for ive's
   canonical estimator and is deleted at this step, once ive ships one.
5. `web-app` — pin bumps, seam wiring (`registerDependencies`), flag flip after the Cypress
   suite is green.

## Success metrics

Instrument before flipping the `useGuidedDesigner` flag so there is a baseline. Events go
through an analytics hook injected via the seam (no-op in standalone):

- **Time to first submit** for a new job (open designer → successful submit) — the headline
  number the redesign should move.
- **Preflight outcomes**: fail/warn rates per check, and how often a deep-link fix is used —
  high fail rates identify which step's affordances still fail users.
- **Abandonment**: drafts opened vs. submitted, and the step where users leave.
- **Terminate-after-submit within N minutes** — a proxy for "submitted with wrong settings",
  which the estimate + preflight should reduce.
- **Monitor engagement** (phase 3): share of running jobs whose owners watch the monitor vs.
  navigate away.

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
   can inject, or is this new backend work? **Still open, and no longer blocking:** 2.3 and
   2.4 shipped with `clusterMetadata` / `computeQuota` as injected props, demo values in the
   standalone apps, and per-tile degradation — core-hours from the job alone, cost only with a
   published price, and a preflight row that reports *skip* rather than passing on no
   evidence. The question is now what the webapp injects, not whether the UI can wait for it.
2. Should preflight warnings (e.g. convergence sanity) come from workflow model metadata or
   stay host-injected only? Package-native heuristics risk false alarms.
3. Does the monitor (3.2) poll job properties or can the webapp provide a push channel? Polling
   is acceptable for v1.
4. File per-phase SOF tickets under SOF-8023 — one per phase, or one per proposal group?
   (Suggest one per phase.)
5. Which analytics channel should the success-metrics events use — the webapp's existing
   telemetry, or is this the moment to add a product-analytics hook to the seam? (Gates the
   baseline capture, not the UI work.)
6. Localization: is English-only acceptable for the new strings at launch (matching the
   packages' current state), with the message-resolver seam making them translatable later?
