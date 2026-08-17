import { getInjectedDeps } from "./setDependencies";

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

export const MESSAGES = {
    // Readiness steps — the rail's labels and one-line summaries.
    "readiness.material.label": "Material",
    "readiness.material.empty": "No material selected",
    "readiness.material.fromParent": "From parent job {name}",
    "readiness.material.single": "1 material",
    "readiness.material.batch": "{count} materials — runs {count} times",
    "readiness.dataset.label": "Dataset",
    "readiness.dataset.empty": "No dataset selected",
    "readiness.workflow.label": "Workflow",
    "readiness.workflow.empty": "No workflow selected",
    "readiness.workflow.withUnits": "{name} · {count} units",
    "readiness.workflow.subworkflowCount": "{count} subworkflows",
    "readiness.compute.label": "Compute",
    "readiness.compute.empty": "Cluster and resources needed",
    "readiness.compute.overNodes": "over the {limit}-node limit",
    "readiness.compute.overPpn": "over {limit} cores per node",
    "readiness.compute.overWalltime": "over the {limit} h queue limit",
    "readiness.review.label": "Review & submit",
    "readiness.review.ready": "Ready to submit",
    "readiness.review.viewOnly": "View only",
    "readiness.review.oneRemaining": "1 step remaining",
    "readiness.review.remaining": "{count} steps remaining",
    "readiness.monitor.label": "Monitor",
    "readiness.monitor.running": "Running",
    "readiness.results.label": "Results",
    "readiness.results.summary": "Outputs and properties",
    "readiness.files.label": "Files",
    "readiness.files.summary": "Job directory",

    // Why Submit is disabled. Read by the button's tooltip and the preflight.
    "blocker.material": "Select a material",
    "blocker.dataset": "Select a dataset",
    "blocker.workflow": "Select a workflow",
    "blocker.compute": "Configure compute",
    "blocker.computeLimits": "Bring compute within the cluster's limits",
    "blocker.save": "Save the job",
    "blocker.more": "{first} (+{count} more)",

    // Preflight rows.
    "preflight.title": "Preflight",
    "preflight.running": "Running checks…",
    "preflight.allPassed": "All checks passed",
    "preflight.oneProblem": "1 problem to fix",
    "preflight.problems": "{count} problems to fix",
    "preflight.oneWarning": "1 warning to acknowledge",
    "preflight.warnings": "{count} warnings to acknowledge",
    "preflight.noChecks": "No checks ran.",
    "preflight.back": "Back to designer",
    "preflight.rerun": "Re-run checks",
    "preflight.submit": "Submit job",
    "preflight.details": "Details",
    "preflight.acknowledge": "Acknowledge",
    "preflight.acknowledged": "Acknowledged",
    "preflight.checkFailed": "This check could not run",
    "preflight.inputs.datasetOk": "Dataset job — materials not required",
    "preflight.inputs.chooseDataset": "Choose a dataset",
    "preflight.inputs.chooseMaterial": "Choose a material",
    "preflight.inputs.batch": "{count} materials — the workflow runs {count} times",
    "preflight.workflow.label": "Workflow renders",
    "preflight.workflow.noRenderer": "{count} units — rendering not available here",
    "preflight.workflow.failed": "A unit's input template failed to render",
    "preflight.workflow.open": "Open the workflow",
    "preflight.workflow.ok": "{count} units · all input templates render",
    "preflight.compute.label": "Compute within limits",
    "preflight.compute.noCluster": "No cluster selected",
    "preflight.compute.adjust": "Adjust compute",
    "preflight.compute.noLimits": "{cluster} · {resources} — no published limits to check against",
    "preflight.compute.overNodes": "{nodes} nodes exceeds the {limit}-node limit",
    "preflight.compute.overPpn": "{ppn} cores per node exceeds the limit of {limit}",
    "preflight.compute.overWalltime": "walltime {walltime} exceeds the queue limit of {limit}",
    "preflight.budget.label": "Budget",
    "preflight.budget.incomplete": "Set nodes, cores and a walltime to estimate the cost",
    "preflight.budget.overQuota": "{usage} — only {remaining} left this month",
    "preflight.budget.mostOfQuota": "{usage} — more than half of the remaining {remaining}",
    "preflight.budget.remainingAfter": "{usage} — {left} would remain",
    "preflight.budget.reduce": "Reduce resources",
    "preflight.budget.wouldRemain": "{left} would be left after this job.",
    "preflight.saved.label": "Saved",
    "preflight.saved.ok": "Job is saved",
    "preflight.saved.never": "The job has never been saved",

    // Save state.
    "saveState.saved": "All changes saved",
    "saveState.unsaved": "Unsaved changes",
    "saveState.saving": "Saving…",

    // Materials tray and metadata.
    "materials.runsOnce": "The workflow runs once.",
    "materials.runsPerMaterial":
        "{count} materials — the workflow runs {count} times, once per material.",
} as const;

export type MessageKey = keyof typeof MESSAGES;

/**
 * Fills `{name}` placeholders. Unknown placeholders are left alone rather than
 * blanked: a translation that names a parameter this call site does not provide
 * should show the gap, not silently swallow it.
 */
function interpolate(template: string, params?: MessageParams): string {
    if (!params) return template;

    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in params ? String(params[name]) : match,
    );
}

/**
 * The localized string for a key.
 *
 * Falls back to English whenever the host has no resolver, or its resolver
 * returns nothing for this key — a missing translation must show the sentence,
 * never the key.
 */
export function getMessage(key: MessageKey, params?: MessageParams): string {
    const { translate } = getInjectedDeps() as { translate?: TranslateFunction };

    if (typeof translate === "function") {
        try {
            const translated = translate(key, params);
            if (translated) return interpolate(translated, params);
        } catch {
            // A host resolver that throws must not take the designer's copy with
            // it; English is always available.
        }
    }

    return interpolate(MESSAGES[key], params);
}
