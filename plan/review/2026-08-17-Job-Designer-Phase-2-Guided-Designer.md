# Job Designer Phase 2 — Guided Designer

- **Ticket:** [SOF-8023](https://mat3ra.atlassian.net/browse/SOF-8023) — Job Designer UX update.
- **Parent:** [../upcoming/2026-08-16-Job-Designer-Guided-Designer-Plan.md](../upcoming/2026-08-16-Job-Designer-Guided-Designer-Plan.md)
  (overview, current state, cove design-language audit, cross-cutting concerns).
- **Status:** built and on branches — every item below is implemented and in review.
  Nothing merged yet, so this document sits in `review/` rather than `implemented/`.
- **Created:** 2026-08-16 · **Updated:** 2026-08-17

## Status — what shipped

| Item | Where | PR |
|------|-------|----|
| 2.1 Readiness rail | job-designer | [job-designer#19](https://github.com/mat3ra/job-designer/pull/19) |
| 2.2 Context strip | job-designer | [job-designer#19](https://github.com/mat3ra/job-designer/pull/19) |
| 2.3 Compute redesign | `@mat3ra/cove` + `@mat3ra/ive` + job-designer | [cove#97](https://github.com/mat3ra/cove/pull/97), [ive#6](https://github.com/mat3ra/ive/pull/6), [job-designer#19](https://github.com/mat3ra/job-designer/pull/19) |
| 2.4 Preflight at submit | job-designer | [job-designer#19](https://github.com/mat3ra/job-designer/pull/19) |
| 2.5 Materials tray and metadata | job-designer | [job-designer#19](https://github.com/mat3ra/job-designer/pull/19) |
| 2.6 Save-state honesty | job-designer | [job-designer#19](https://github.com/mat3ra/job-designer/pull/19) |

The whole phase is behind one opt-in flag, `useGuidedDesigner` (job-designer) /
`useComputeCards` (ive), defaulted **on** in the standalone demos and **off** for hosts. A
host on the old layout sees no change at all; the demo is where the new one gets reviewed.

Measured in the standalone demos: a draft with nothing configured reports **4 steps
remaining** and a Submit that names the first of them; filling compute moves it to **Ready
to submit** with an estimate chip reading `64 core·h ≈ $5.12`; the preflight on that job
returns **five passes**; raising the walltime to 24 h turns the Compute step to *over the
12 h queue limit*, disables Submit, and puts the reason in its tooltip; a within-limits
4 × 32 × 12 h job passes the limits check and **fails the budget** at 1536 of 500 core·h,
with "Reduce resources" landing on the Compute step; a warning holds Submit until
acknowledged, then releases it.

### Divergences from the plan as written

- **2.3's estimator did not land in ive as a panel-local helper; it is the package's public
  arithmetic, and job-designer carries a temporary copy.** The plan put
  `estimateComputeCost` "beside the panel". It is instead `@mat3ra/ive`'s
  `utils/computeEstimate`, exported, because three surfaces need the same answer — ive's
  estimate panel, job-designer's context-strip chip, and the preflight's budget check —
  and three implementations of "what does this job cost" would be worse than none. Until
  an ive release ships it, job-designer holds an identical copy at `src/computeEstimate.ts`
  carrying a `TODO(SOF-8023)` to delete it and import from ive.
- **2.3 is opt-in and additive rather than a rewrite of the compute form.** The cluster,
  queue, nodes, cores and walltime fields move to a new surface above the schema form and
  are *hidden* in it — not removed — so the ESSE schema still validates them and writes go
  through the same `handleFormUpdate` path as a keystroke. Espresso's advanced options are
  untouched. The group left holding only two documentation links is retitled
  *Documentation*, since calling it "Cluster" would send readers looking for a picker that
  moved.
- **2.4 is gated on the same flag as the layout.** The plan did not say. Submit opening a
  dialog changes what one click does, so hosts still on the numbered tabs keep today's
  one-click submit rather than silently gaining a second step.
- **The preflight distinguishes four outcomes, not three.** Alongside pass / warn / fail
  there is **skip**: a check that could not be judged, because the host published no
  pricing, no limits or no quota. Most deployments inject none of that, and a green
  "Budget" row backed by nothing would be a lie the reader has no way to check.
- **The readiness selector had to learn about cluster limits, and the Submit button had to
  stop calling `getSubmitBlockers` itself.** Without it the rail showed Compute *complete*
  over a preflight that refused to submit — the exact contradiction the selector exists to
  prevent. `getSubmitBlockedReason` was split so the button can be driven from the
  readiness report instead of recomputing its own.
- **2.1's `TAB_NAVIGATION_CONFIG` change was not needed.** The plan proposed growing
  per-tab step metadata in `@mat3ra/jode`. The rail derives order and labels from the
  readiness selector, and reuses the existing tab ids for deep links, so jode is untouched
  — one fewer package in the release train.
- **2.2's estimate chip arrived with 2.4, not with the strip.** It needs the estimator,
  which is 2.3's; the strip shipped first without it and gained the chip once the
  arithmetic existed.
- **The standalone demo needed real data before any of this could be reviewed.** It passed
  `clusters={[]}`, so the compute step could not be filled at all, and the job had no `_id`,
  so Submit was permanently blocked on "Save the job". Both are fixed in the demo with a
  comment saying why. The demo's queue objects also needed `getETAClient()` — ive's queue
  table calls it, and a plain object crashes the picker.
- **4 → 5 checks.** The plan listed material, workflow renders, compute limits, and cost vs
  quota. A fifth — *Saved* — was added, because "the job has never been saved" was
  otherwise reported only by a disabled button.

### Found by auditing the acceptance criteria against the running app

Two of 2.1's criteria were recorded as built and were not; both are now fixed (see the
"Built" note under 2.1). A third is a question rather than a defect:

- **A saved draft cannot change its materials.** `MaterialTab` receives
  `addRemoveAllowed={!job.id}`, so the tray's Add and Remove affordances disappear the moment
  a draft is saved — while `editable` (which is `status === pre_submission`) stays true, so
  the designer simultaneously reports the job as editable. This predates the guided designer,
  but the guided designer makes it matter much more: the tray is now the *primary* affordance
  for materials, and on any saved draft it is inert. Whether the rule is intended is a product
  question — materials may well be baked into the saved job document — so it is recorded here
  rather than changed. The rail's "Change Material" affordance is gated on
  `isInInitialStatus` instead, so the selector itself remains reachable.
- Consequently **"removing the active material selects a sane neighbour" is unverified in the
  demo**: its job carries an `_id` so that Submit is not permanently blocked on "Save the
  job", which switches the remove affordance off. The batch copy either side of it is
  verified — see below.

### Still open

- **Queue-derived limits.** Limits come from `clusterMetadata` per cluster; real queues
  differ within a cluster (`nodeLimit`, `maxPPN` per queue). The shape supports it —
  `ClusterLimits` would move under the queue — but no host publishes it yet.
- **Same-as-last-job preset.** The plan listed it alongside Debug / Standard / Production.
  It needs the reader's previous job, which is host data job-designer does not hold; it
  wants an injected `getLastComputeConfiguration()` and is not built.
- **Release ordering.** ive's new components import cove's new primitives, and
  job-designer's compute wiring is inert until ive ships. Phase 3 extended the train to
  cove → wove → ive / workflow-designer / jove → job-designer; see
  [`2026-08-17-Job-Designer-Phase-3-Living-Job.md`](2026-08-17-Job-Designer-Phase-3-Living-Job.md).
- **Webapp-side data.** `clusterMetadata` and `computeQuota` are injected props with demo
  values only; nothing in the webapp publishes pricing, limits or quota yet. Until it does,
  the estimate shows core-hours alone and the limit and budget checks report *skip*.

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
  preflight. It must cover all creation shapes: material jobs, dataset jobs
  (`workflow.isUsingDataset`), multi-material sets (`materialsSet` / `isMultiMaterial`), and
  parent-derived jobs (parent supplies the material — the Material step reads "from parent
  job", not "missing").
- **The rail spans the whole lifecycle, not just creation.** After submission the creation
  steps collapse into read-only summaries and Monitor (later Results, Files) become the active
  steps — this replaces today's `defaultTab` status-jumping logic. With `editable={false}`
  (shared/public jobs) the rail renders view-only: no "Change" affordances, no Submit.
- `TAB_NAVIGATION_CONFIG` (`@mat3ra/jode`) grows optional per-tab step metadata (order, label)
  so webapp and standalone agree on the sequence.
- The three "Select …" dialogs stay as they are, but open from "Change" affordances on their
  steps.
- Layout: rail left (fixed ~260 px, collapses to a horizontal stepper under 760 px — the
  compact variant can extend cove's existing `StyledStepper`), content right. Step state
  renders with cove `StatusChip` colors from the job-status mapping (1.5). Keep the DOM of tab
  panels unchanged where possible so Cypress selectors survive.
- Acceptance: a new user can create and submit a job without opening any dropdown; deep links
  via `getRouteQueryTab` still land on the right step; a finished job opens on Monitor/Results
  with creation steps summarized; the rail is keyboard-navigable (arrow keys between steps,
  visible focus, `aria-current` on the active step). Size: L.
- **Built** — `src/jobReadiness.ts` (16 unit tests) and `src/components/JobReadinessRail.tsx`.
  Two criteria were initially missed and fixed after an audit against the running app: each
  step that owns a "Select …" dialog now carries a **Change** (or **Choose**) affordance, so
  the headline acceptance — creating a job without opening the dropdown — actually holds; and
  the rail **collapses to a horizontal scrolling strip below the md breakpoint** rather than
  stacking full-width rows that pushed the step's own content off a narrow screen. Adding the
  affordances exposed a crash (`object is not iterable`): the package's dialog types describe
  `{ isOpen, open, close }` while `Job.jsx` destructures `[open, close]`, and only the
  never-clicked dropdown had ever reached them. `normalizeDialogHandle` accepts either.
  `@mat3ra/jode` was left alone: the rail takes its order and labels from the selector and
  reuses the existing tab ids, so deep links keep working without new schema. The selector
  also reads host-published cluster limits, so the Compute step says *over the 12 h queue
  limit* rather than showing a green tick over a preflight that would refuse.

### 2.2 Context strip (A2) — job-designer

- New `JobContextStrip` under the header: chips for material (formula · source), workflow
  (name · subworkflow/unit counts), compute (cluster · nodes×cores · walltime), estimate
  (core-hours ≈ cost). Chips navigate to their step; incomplete chips render in the attention
  style. Data comes from the same `getJobReadiness` selector plus the estimate helper (2.3).
- The parent job moves here too: today it renders as a dismissable `Alert` above the tabs
  (`Job.jsx#renderParentJob`); it becomes a context chip (parent name · project) with the
  remove affordance in its popover — same `setParent` / `unsetParent` model calls (the flow
  fixed in SOF-7962).
- Acceptance: on every step, the other selections stay visible; clicking a chip switches step;
  a parent-derived job shows the parent chip and no orphaned Alert. Size: S–M.
- **Built** — `src/components/JobContextStrip.tsx`. The estimate chip arrived later, with
  2.3's estimator; the strip shipped first without it rather than showing a placeholder.

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
- The advanced-options section (`showAdvancedComputeOptions`, gated today by the applications'
  `hasAdvancedComputeOptions` in `Job.jsx`) is preserved as a collapsed "Advanced" group below
  the cards — redesign must not drop the espresso-class options.
- Acceptance: changing any field updates the estimate synchronously; exceeding a limit flags
  the field and the estimate panel; presets fill the form in one click; advanced options remain
  reachable; webapp data path and standalone fallback both render. Size: L.
- **Built** — four new cove primitives (`SelectableCard`, `MetricTile`, `SegmentedMeter`,
  `NumericStepperInput`, with their bound arithmetic and meter geometry unit-tested), then
  `ClusterCards`, `ComputeResources` and `ComputeEstimatePanel` in ive behind
  `useComputeCards`. Presets are clamped to the cluster's limits, so the button that exists
  to avoid an invalid configuration cannot produce one. Open question 1 is still open —
  nothing publishes pricing or quota — so the panel degrades per tile rather than waiting on
  it.

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
  Size: M–L.
- **Built** — `src/preflight/` (five checks, a runner, 20 unit tests) and
  `src/components/PreflightDialog.tsx`. Hosts append their own checks through
  `setDependencies({ preflightChecks })`. A check that throws yields a *skip* row rather than
  blocking submission: our own bug must not stand between a reader and their job.

### 2.5 Materials tray and metadata (E1, E2) — job-designer (+ viewer package)

- `MaterialTab` gains a chips tray above the viewer (add / remove / switch — reusing
  `onUpdateIndex`, `onMaterialRemove`, `openAddMaterialsDialog`) and the explicit copy
  "N materials → the workflow runs N times". Multi-material switching stops hiding inside the
  Workflow tab (the workflow pane's switcher stays for parity but the tray is the primary
  affordance).
- Metadata side panel (formula, lattice, space group, atom count, source id) rendered from the
  `Material` model next to the injected viewer; the viewer component API is unchanged.
- Acceptance: adding a second material updates the tray, the batch copy, and the context strip;
  removing the active material selects a sane neighbor. Size: M.
- **Verified in the demo** with its new 1-vs-3 materials toggle: three chips in the tray over
  "3 materials — the workflow runs 3 times, once per material.", with the rail step and the
  context chip both reading "3 materials — runs 3 times". The removal half could not be
  exercised — see the audit note above.
- **Built** — [job-designer#19](https://github.com/mat3ra/job-designer/pull/19). Divergence:
  the metadata is read through a defensive `getMaterialSummary()` that omits any field it
  cannot read, because `MaterialTab` already renders a fallback for hosts passing a plain
  config and made's model getters throw on partial data. Space group is shown only when the
  model actually carries a `symmetry` derived property — standata materials generally do not,
  so the row is usually absent rather than guessed from the name.

### 2.6 Save-state honesty (new; relates to UX-498)

- The header states the truth about persistence: "Saved" only after the entity actually
  persisted through `onSave` / the `shouldPersistJobOnUpdate` pipeline, "Unsaved changes"
  otherwise, and a leave-guard (browser `beforeunload` + router guard injected via the seam)
  when a dirty draft is about to be abandoned. The mockups' "All changes saved" copy is the
  target state; showing it without it being true would be worse than today.
- Explicit non-goal here: no new autosave backend — this item only surfaces existing state
  honestly. If product wants real autosave (UX-498 direction), that is a separate ticket.
- Acceptance: editing any field flips the indicator to dirty; Save flips it back; closing the
  tab with a dirty draft warns; the indicator never claims "Saved" while in-memory state
  differs from the persisted entity. Size: S–M.
- **Built** — [job-designer#19](https://github.com/mat3ra/job-designer/pull/19). Dirty state is
  marked in the mutating handlers rather than in `persistJob()`, which also runs on mount and
  on entering the Workflow tab; and both save paths were routed through a single `saveJob()`
  so the flag cannot be cleared by one header and missed by the other.
