import {
    estimateComputeUsage,
    findClusterMetadata,
    formatCoreHours,
    formatCost,
    parseWalltimeHours,
} from "../computeEstimate";
import { getMaterialSummary } from "../materialSummary";
import type { PreflightCheck, PreflightRow } from "./types";

/**
 * The checks that run before a job is submitted, in the order a reader would
 * work through them: what it runs on, what it runs, where it runs, what it
 * costs.
 *
 * Each is a pure-ish async function of the preflight context. They are separate
 * exports rather than one big function so the host can drop one or slot its own
 * between them (see `runPreflightChecks`), and so each can be unit-tested with
 * the smallest possible context.
 *
 * The rule they all follow: a check that cannot be judged returns `skip`, never
 * `pass`. A dialog that says "Budget — fine" when it has never seen a price is
 * worse than one that says it does not know.
 */

function capitalise(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatHours(hours: number): string {
    const rounded = Math.round(hours * 10) / 10;

    return `${rounded} h`;
}

/** The job runs on something: a material, a set of them, or a dataset. */
export const checkInputs: PreflightCheck = async ({
    job,
    materials = [],
    isUsingMaterials = true,
}) => {
    if (!isUsingMaterials) {
        const hasDataset = Boolean(job.workflow?.isUsingDataset);

        return {
            id: "inputs",
            label: "Dataset",
            state: hasDataset ? "pass" : "fail",
            detail: hasDataset ? "Dataset job — materials not required" : "No dataset selected",
            fix: hasDataset ? undefined : { label: "Choose a dataset", stepId: "dataset" },
        };
    }

    if (materials.length === 0) {
        return {
            id: "inputs",
            label: "Material",
            state: "fail",
            detail: "No material selected",
            fix: { label: "Choose a material", stepId: "material" },
        };
    }

    if (materials.length > 1) {
        return {
            id: "inputs",
            label: "Material",
            state: "pass",
            // The multiplier is the thing a reader most often does not expect at
            // submit time, so it is the thing the row says.
            detail: `${materials.length} materials — the workflow runs ${materials.length} times`,
        };
    }

    const summary = getMaterialSummary(materials[0]);
    const atoms = summary.atomCount === undefined ? undefined : `${summary.atomCount} atoms`;

    return {
        id: "inputs",
        label: "Material",
        state: "pass",
        detail:
            [summary.formula ?? summary.name ?? "1 material", atoms].filter(Boolean).join(" · ") ||
            "1 material",
    };
};

/**
 * The workflow renders. This is the one check that touches the entity: rendering
 * is how template errors surface at all, and it is what submission would do a
 * moment later anyway — better to find out here, with a row pointing at the
 * workflow, than in a failed run.
 */
export const checkWorkflowRenders: PreflightCheck = async ({ job }) => {
    const subworkflows = job.workflow?.subworkflows ?? [];

    if (!subworkflows.length) {
        return {
            id: "workflow",
            label: "Workflow renders",
            state: "fail",
            detail: "No workflow selected",
            fix: { label: "Choose a workflow", stepId: "workflow" },
        };
    }

    const unitCount = subworkflows.reduce(
        (total: number, subworkflow: any) => total + (subworkflow?.units?.length ?? 0),
        0,
    );

    if (typeof job.render !== "function") {
        return {
            id: "workflow",
            label: "Workflow renders",
            state: "skip",
            detail: `${unitCount} units — rendering not available here`,
        };
    }

    try {
        job.render();
    } catch (error) {
        return {
            id: "workflow",
            label: "Workflow renders",
            state: "fail",
            detail: "A unit's input template failed to render",
            explanation: error instanceof Error ? error.message : String(error),
            fix: { label: "Open the workflow", stepId: "workflow" },
        };
    }

    return {
        id: "workflow",
        label: "Workflow renders",
        state: "pass",
        detail: `${unitCount} units · all input templates render`,
    };
};

/**
 * Compute is set, and within the cluster's limits when the host told us what
 * they are. Without metadata this can still say whether a cluster and resources
 * were chosen — that part needs no host data.
 */
export const checkComputeLimits: PreflightCheck = async ({ job, clusterMetadata = [] }) => {
    const { compute } = job;
    const clusterName = compute?.cluster?.fqdn;

    if (!clusterName) {
        return {
            id: "compute",
            label: "Compute within limits",
            state: "fail",
            detail: "No cluster selected",
            fix: { label: "Configure compute", stepId: "compute" },
        };
    }

    const walltimeHours = parseWalltimeHours(compute?.timeLimit);
    const resources = `${compute?.nodes ?? "?"}×${compute?.ppn ?? "?"}`;
    const limits = findClusterMetadata(compute, clusterMetadata)?.limits;

    if (!limits) {
        return {
            id: "compute",
            label: "Compute within limits",
            state: "skip",
            detail: `${clusterName} · ${resources} — no published limits to check against`,
        };
    }

    const violations: string[] = [];
    if (limits.maxNodes !== undefined && (compute?.nodes ?? 0) > limits.maxNodes) {
        violations.push(`${compute.nodes} nodes exceeds the ${limits.maxNodes}-node limit`);
    }
    if (limits.maxPpn !== undefined && (compute?.ppn ?? 0) > limits.maxPpn) {
        violations.push(`${compute.ppn} cores per node exceeds the limit of ${limits.maxPpn}`);
    }
    if (
        limits.maxWalltimeHours !== undefined &&
        walltimeHours !== undefined &&
        walltimeHours > limits.maxWalltimeHours
    ) {
        violations.push(
            `walltime ${formatHours(walltimeHours)} exceeds the queue limit of ${formatHours(
                limits.maxWalltimeHours,
            )}`,
        );
    }

    if (violations.length) {
        return {
            id: "compute",
            label: "Compute within limits",
            state: "fail",
            detail: capitalise(violations[0]),
            explanation: violations.length > 1 ? violations.map(capitalise).join(". ") : undefined,
            fix: { label: "Adjust compute", stepId: "compute" },
        };
    }

    const walltime = walltimeHours === undefined ? undefined : formatHours(walltimeHours);

    return {
        id: "compute",
        label: "Compute within limits",
        state: "pass",
        detail: [clusterName, resources, walltime].filter(Boolean).join(" · "),
    };
};

/**
 * What the run will consume against what is left. Skips rather than passes when
 * the host injected no quota — most deployments have none, and a green "Budget"
 * row backed by nothing would be a lie the reader has no way to check.
 */
export const checkBudget: PreflightCheck = async ({
    job,
    materials = [],
    isUsingMaterials = true,
    clusterMetadata = [],
    quota,
}) => {
    const runs = isUsingMaterials ? Math.max(materials.length, 1) : 1;
    const estimate = estimateComputeUsage(job.compute, clusterMetadata, runs);

    if (estimate.coreHours === undefined) {
        return {
            id: "budget",
            label: "Budget",
            state: "skip",
            detail: "Set nodes, cores and a walltime to estimate the cost",
        };
    }

    const usage = [
        formatCoreHours(estimate.coreHours),
        formatCost(estimate.cost, estimate.currency),
    ]
        .filter(Boolean)
        .join(" ≈ ");
    const remaining = quota?.remainingCoreHours;

    if (remaining === undefined) {
        return { id: "budget", label: "Budget", state: "skip", detail: usage };
    }

    if (estimate.coreHours > remaining) {
        return {
            id: "budget",
            label: "Budget",
            state: "fail",
            detail: `${usage} — only ${formatCoreHours(remaining)} left this month`,
            fix: { label: "Reduce resources", stepId: "compute" },
        };
    }

    const left = remaining - estimate.coreHours;
    // A run that eats most of what is left is worth stopping on, but it is the
    // account holder's call, not ours — hence warn, which they can acknowledge.
    if (estimate.coreHours > remaining / 2) {
        return {
            id: "budget",
            label: "Budget",
            state: "warn",
            detail: `${usage} — more than half of the remaining ${formatCoreHours(remaining)}`,
            explanation: `${formatCoreHours(left)} would be left after this job.`,
        };
    }

    return {
        id: "budget",
        label: "Budget",
        state: "pass",
        detail: `${usage} — ${formatCoreHours(left)} would remain`,
    };
};

/**
 * The job exists server-side. Last, because unlike the others it is fixed with
 * the button next to Submit rather than by going to a step.
 */
export const checkSaved: PreflightCheck = async ({ job }) => {
    if (job.id) {
        return { id: "saved", label: "Saved", state: "pass", detail: "Job is saved" };
    }

    return {
        id: "saved",
        label: "Saved",
        state: "fail",
        detail: "The job has never been saved",
        fix: { label: "Save the job", stepId: "review" },
    };
};

export const DEFAULT_PREFLIGHT_CHECKS: PreflightCheck[] = [
    checkInputs,
    checkWorkflowRenders,
    checkComputeLimits,
    checkBudget,
    checkSaved,
];

export type { PreflightRow };
