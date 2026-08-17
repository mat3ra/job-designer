/**
 * Every sentence the guided designer says, in one place.
 *
 * The webapp localizes through TAPi18n; this package cannot import it, and a
 * string typed inline in a component is a string no translator will ever find.
 * So each one lives here with an English default and a key, and the host
 * substitutes its own resolver through `setDependencies({ translate })`.
 *
 * Interpolation matters more than it looks. "3 materials — runs 3 times" is not
 * a sentence a catalogue can hold as a fragment plus a number: languages put the
 * count in different places and inflect the noun differently. Every message that
 * varies takes named parameters and stays one string, so a translation can move
 * them.
 *
 * Keys are grouped by where they are said, not by the component that says them —
 * the same readiness summary appears in the rail, the context strip and the
 * preflight, and it must read identically in all three.
 */
export type MessageParams = Record<string, string | number>;
/** Resolves a key to a localized string. Returns undefined to fall back. */
export type TranslateFunction = (key: string, params?: MessageParams) => string | undefined;
export declare const MESSAGES: {
    readonly "readiness.material.label": "Material";
    readonly "readiness.material.empty": "No material selected";
    readonly "readiness.material.fromParent": "From parent job {name}";
    readonly "readiness.material.single": "1 material";
    readonly "readiness.material.batch": "{count} materials — runs {count} times";
    readonly "readiness.dataset.label": "Dataset";
    readonly "readiness.dataset.empty": "No dataset selected";
    readonly "readiness.workflow.label": "Workflow";
    readonly "readiness.workflow.empty": "No workflow selected";
    readonly "readiness.workflow.withUnits": "{name} · {count} units";
    readonly "readiness.workflow.subworkflowCount": "{count} subworkflows";
    readonly "readiness.compute.label": "Compute";
    readonly "readiness.compute.empty": "Cluster and resources needed";
    readonly "readiness.compute.overNodes": "over the {limit}-node limit";
    readonly "readiness.compute.overPpn": "over {limit} cores per node";
    readonly "readiness.compute.overWalltime": "over the {limit} h queue limit";
    readonly "readiness.review.label": "Review & submit";
    readonly "readiness.review.ready": "Ready to submit";
    readonly "readiness.review.viewOnly": "View only";
    readonly "readiness.review.oneRemaining": "1 step remaining";
    readonly "readiness.review.remaining": "{count} steps remaining";
    readonly "readiness.monitor.label": "Monitor";
    readonly "readiness.monitor.running": "Running";
    readonly "readiness.results.label": "Results";
    readonly "readiness.results.summary": "Outputs and properties";
    readonly "readiness.files.label": "Files";
    readonly "readiness.files.summary": "Job directory";
    readonly "blocker.material": "Select a material";
    readonly "blocker.dataset": "Select a dataset";
    readonly "blocker.workflow": "Select a workflow";
    readonly "blocker.compute": "Configure compute";
    readonly "blocker.computeLimits": "Bring compute within the cluster's limits";
    readonly "blocker.save": "Save the job";
    readonly "blocker.more": "{first} (+{count} more)";
    readonly "preflight.title": "Preflight";
    readonly "preflight.running": "Running checks…";
    readonly "preflight.allPassed": "All checks passed";
    readonly "preflight.oneProblem": "1 problem to fix";
    readonly "preflight.problems": "{count} problems to fix";
    readonly "preflight.oneWarning": "1 warning to acknowledge";
    readonly "preflight.warnings": "{count} warnings to acknowledge";
    readonly "preflight.noChecks": "No checks ran.";
    readonly "preflight.back": "Back to designer";
    readonly "preflight.rerun": "Re-run checks";
    readonly "preflight.submit": "Submit job";
    readonly "preflight.details": "Details";
    readonly "preflight.acknowledge": "Acknowledge";
    readonly "preflight.acknowledged": "Acknowledged";
    readonly "preflight.checkFailed": "This check could not run";
    readonly "preflight.inputs.datasetOk": "Dataset job — materials not required";
    readonly "preflight.inputs.chooseDataset": "Choose a dataset";
    readonly "preflight.inputs.chooseMaterial": "Choose a material";
    readonly "preflight.inputs.batch": "{count} materials — the workflow runs {count} times";
    readonly "preflight.workflow.label": "Workflow renders";
    readonly "preflight.workflow.noRenderer": "{count} units — rendering not available here";
    readonly "preflight.workflow.failed": "A unit's input template failed to render";
    readonly "preflight.workflow.open": "Open the workflow";
    readonly "preflight.workflow.ok": "{count} units · all input templates render";
    readonly "preflight.compute.label": "Compute within limits";
    readonly "preflight.compute.noCluster": "No cluster selected";
    readonly "preflight.compute.adjust": "Adjust compute";
    readonly "preflight.compute.noLimits": "{cluster} · {resources} — no published limits to check against";
    readonly "preflight.compute.overNodes": "{nodes} nodes exceeds the {limit}-node limit";
    readonly "preflight.compute.overPpn": "{ppn} cores per node exceeds the limit of {limit}";
    readonly "preflight.compute.overWalltime": "walltime {walltime} exceeds the queue limit of {limit}";
    readonly "preflight.budget.label": "Budget";
    readonly "preflight.budget.incomplete": "Set nodes, cores and a walltime to estimate the cost";
    readonly "preflight.budget.overQuota": "{usage} — only {remaining} left this month";
    readonly "preflight.budget.mostOfQuota": "{usage} — more than half of the remaining {remaining}";
    readonly "preflight.budget.remainingAfter": "{usage} — {left} would remain";
    readonly "preflight.budget.reduce": "Reduce resources";
    readonly "preflight.budget.wouldRemain": "{left} would be left after this job.";
    readonly "preflight.saved.label": "Saved";
    readonly "preflight.saved.ok": "Job is saved";
    readonly "preflight.saved.never": "The job has never been saved";
    readonly "saveState.saved": "All changes saved";
    readonly "saveState.unsaved": "Unsaved changes";
    readonly "saveState.saving": "Saving…";
    readonly "materials.runsOnce": "The workflow runs once.";
    readonly "materials.runsPerMaterial": "{count} materials — the workflow runs {count} times, once per material.";
};
export type MessageKey = keyof typeof MESSAGES;
/**
 * The localized string for a key.
 *
 * Falls back to English whenever the host has no resolver, or its resolver
 * returns nothing for this key — a missing translation must show the sentence,
 * never the key.
 */
export declare function getMessage(key: MessageKey, params?: MessageParams): string;
//# sourceMappingURL=messages.d.ts.map