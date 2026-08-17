# Job Designer — UI/UX improvement proposals

Companion to the Materials Designer exercise: prioritized interface proposals for the Job
Designer, grounded in the current code, with interactive mockups in [`mockups/`](mockups/).

The designer today is a five-tab shell (`src/components/Job.jsx`) around three packages:
the workflow editor (`@mat3ra/workflow-designer`), the compute form (`Compute` from
`@mat3ra/ive`), and results/files views (`@mat3ra/jove`). Most of what a user must *do* to
create a job — pick materials, pick a workflow, configure compute, submit — hides behind
the "Select Job Actions" dropdown built in `Job.jsx#getDefaultActions`, and the numbered
tabs (`1. MATERIALS / 2. WORKFLOW / 3. COMPUTE` from `TAB_NAVIGATION_CONFIG` in
`@mat3ra/jode`) imply a sequence without tracking progress through it.

## Observations (current state)

1. **The path is hidden.** Select materials / workflow / parent / dataset and Submit all
   live in one dropdown menu; nothing on screen says what a new job still needs before it
   can run. Tabs are numbered like steps but carry no completion state.
2. **No cross-tab context.** On the Compute tab there is no trace of which material or
   workflow is selected; on the Workflow tab, no trace of compute. Every check requires a
   tab switch.
3. **Compute answers no questions.** The form opens with four red "The field is required"
   errors before the user has touched anything, cluster/queue are bare selects, cluster
   status is an external link, and nothing estimates core-hours, cost, or queue wait.
4. **Workflow tab noise.** A second "Compute" sub-tab inside the Workflow tab duplicates
   the top-level tab; raw UUIDs are printed on every subworkflow card and flowchart node;
   "idle" status chips decorate a job that was never submitted; the flowchart pane stays
   light-themed inside the dark shell.
5. **Submit is a leap of faith.** No preflight: nothing validates compute against cluster
   limits or shows the cost before the job leaves. After submit the user lands on the same
   editing view; Results/Files tabs appear only later and are passive lists.
6. **Materials are a lone canvas.** The Materials tab is a full-bleed 3D viewer with no
   metadata panel; for multi-material jobs the set switcher hides inside the Workflow tab,
   and the "runs N times" consequence of a materials set is never stated.

## Proposals

### A — One glance, one path
- **A1 · Readiness rail.** Replace the numbered full-width tabs + actions dropdown with a
  left rail of lifecycle steps — Material, Workflow, Compute, Review & Submit — each
  showing its current selection summary and state (complete / needs attention / empty).
  The three "Select …" dialogs become "Change" affordances on their steps.
- **A2 · Context strip.** A persistent strip under the header with chips for material,
  workflow, compute and estimated cost — visible from every step, each chip a shortcut.
- **A3 · First-class Submit.** Submit is a primary header button with live preflight
  state (disabled explains *what's missing*), replaced by Terminate while running.

### B — Compute that answers "what will this run, and what will it cost?"
- **B1 · Cluster cards.** Replace bare selects with selectable cards: hardware summary,
  per-core-hour price, live queue-wait badge (inline; kills the "See cluster status" link).
- **B2 · Live estimate.** Side panel derives core-hours = nodes × cores × walltime, price,
  queue ETA, and quota impact as the form changes; flags requests that exceed queue limits.
- **B3 · Presets.** Debug / Standard / Production (and "same as last job") one-click fills.
- **B4 · Progressive validation.** Validate on interaction and at preflight — never render
  a screen of red required-field errors on first paint.

### C — Review & submit with confidence
- **C1 · Preflight checklist.** Submit opens a check run — material set, workflow
  parameters render, compute within cluster/queue limits, cost within budget — with
  pass / warn / fail rows; fails deep-link to the offending step, warns are acknowledgeable.
- **C2 · Post-submit hand-off.** Successful submit transitions the designer into monitor
  mode (F1) instead of leaving a stale editor open.

### D — Workflow tab clarity
- **D1 · One Compute.** Drop the duplicated "Compute" sub-tab inside the Workflow tab.
- **D2 · Humane metadata.** UUIDs move behind a copy-id affordance; status chips appear
  only once a job has been submitted.
- **D3 · Unit inspector.** Clicking a flowchart node opens a right drawer with that unit's
  important settings, replacing the Overview / Important settings / Detailed view sub-tab
  bounce.
- **D4 · Theme parity.** Token-driven theming for the flowchart pane so it follows the
  shell's theme.

### E — Materials in context
- **E1 · Materials tray.** Chips for the materials set above the viewer with add / remove /
  switch inline, and explicit "this job runs N times — once per material" copy.
- **E2 · Metadata panel.** Formula, lattice, atom count, source id beside the 3D viewer.

### F — The job lives after Submit
- **F1 · Run monitor.** The post-submit view becomes live: per-unit timeline with
  statuses and durations, streaming log tail, convergence chart, files appearing as
  produced, results summary on finish.
- **F2 · Lifecycle header.** Draft → Queued → Running → Finished timeline with timestamps
  in the header, replacing the lone status-colored icon (`iconCls: text-${job.statusCls}`).

## Mockups

| # | File | Covers |
|---|------|--------|
| 01 | [`mockups/01-guided-designer.html`](mockups/01-guided-designer.html) | A1 A2 A3 · D2 · E1 E2 |
| 02 | [`mockups/02-compute-cost.html`](mockups/02-compute-cost.html) | B1 B2 B3 B4 |
| 03 | [`mockups/03-preflight-submit.html`](mockups/03-preflight-submit.html) | C1 C2 |
| 04 | [`mockups/04-run-monitor.html`](mockups/04-run-monitor.html) | F1 F2 · C2 |

Each mockup is a self-contained HTML file (no build step, no network) — open directly in a
browser.

## Rollout sketch

| Phase | Scope | Proposals | Mostly lands in |
|-------|-------|-----------|-----------------|
| 1 — de-noise | Low-risk cleanups inside current layout | B4 · D1 · D2 · A3 | job-designer, `@mat3ra/ive`, `@mat3ra/workflow-designer` |
| 2 — the guided designer | Layout change: rail + context strip + compute redesign + preflight | A1 · A2 · B1–B3 · C1 · E1 · E2 | job-designer (`Job.jsx`), `@mat3ra/ive`, `@mat3ra/cove` |
| 3 — the living job | Monitoring + inspector + theming | F1 · F2 · C2 · D3 · D4 | `@mat3ra/jove`, `@mat3ra/workflow-designer` |

Phase 1 is deliberately shippable without design sign-off on the new layout; Phase 2 is
where the designer stops being a filing cabinet; Phase 3 closes the loop after submission.
