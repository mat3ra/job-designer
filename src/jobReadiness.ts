import { type ClusterMetadata, findClusterMetadata, parseWalltimeHours } from "./computeEstimate";
import { getSubmitBlockers, type SubmittableJob } from "./jobSubmission";
import { getMessage } from "./messages";

/**
 * What the job still needs, as a sequence of steps.
 *
 * The designer's tabs are numbered ("1. Materials", "2. Workflow", "3. Compute")
 * but carry no progress: they look identical whether a step is done, half-done
 * or untouched, and the actions that complete them live in a dropdown. This is
 * the single source of truth for that state — the rail, the context strip, the
 * Submit button and the submit preflight all read it, so they cannot disagree
 * about whether a job is ready.
 *
 * A pure function of the job and its inputs. It never touches the entity, and
 * in particular never triggers `job.render()`: `Job.jsx` runs that from
 * `persistJob()`, and recomputing readiness on a compute keystroke must not drag
 * a workflow re-render along with it.
 */

export type ReadinessState =
    /** Done — carries a summary of what was chosen. */
    | "complete"
    /** Started but not usable yet, or holding something invalid. */
    | "attention"
    /** Nothing chosen yet. */
    | "empty"
    /** Not applicable, or not reachable in this job's status. */
    | "unavailable";

export interface ReadinessStep {
    /** Matches `TAB_NAVIGATION_CONFIG` ids where one exists, so deep links keep working. */
    id: string;
    label: string;
    state: ReadinessState;
    /** One line naming what is chosen, or what to do. Shown under the label. */
    summary: string;
}

export interface JobReadiness {
    steps: ReadinessStep[];
    isSubmittable: boolean;
    blockingReasons: string[];
    /** True once the job has left draft — creation steps become read-only summaries. */
    isRunOrFinished: boolean;
}

export interface JobReadinessOptions {
    job: SubmittableJob & {
        name?: string;
        status?: string;
        isInFinalStatus?: boolean;
        getParentJobClient?: () => { name?: string } | null;
        compute?: any;
        workflow?: any;
    };
    materials?: any[];
    /** False for dataset-driven jobs, where a dataset takes the place of materials. */
    isUsingMaterials?: boolean;
    datasetConfig?: { name?: string } | null;
    /** False for shared or finished jobs: the rail renders view-only. */
    editable?: boolean;
    /**
     * Per-cluster limits, injected by the host. Absent, the compute step judges
     * only whether a cluster was chosen — it does not invent limits to enforce.
     */
    clusterMetadata?: ClusterMetadata[];
}

const REVIEW_STEP_ID = "review";

function describeMaterials(materials: any[], parentJobName?: string): string {
    if (parentJobName) return getMessage("readiness.material.fromParent", { name: parentJobName });
    if (materials.length === 0) return getMessage("readiness.material.empty");
    if (materials.length === 1) {
        const [material] = materials;
        return material?.formula ?? material?.name ?? getMessage("readiness.material.single");
    }

    return getMessage("readiness.material.batch", { count: materials.length });
}

function describeWorkflow(workflow: any): string {
    const subworkflows = workflow?.subworkflows ?? [];
    if (!subworkflows.length) return getMessage("readiness.workflow.empty");

    const unitCount = subworkflows.reduce(
        (total: number, subworkflow: any) => total + (subworkflow?.units?.length ?? 0),
        0,
    );
    const name =
        workflow?.name ??
        getMessage("readiness.workflow.subworkflowCount", { count: subworkflows.length });

    return unitCount
        ? getMessage("readiness.workflow.withUnits", { name, count: unitCount })
        : name;
}

function describeCompute(compute: any): string {
    const clusterName = compute?.cluster?.fqdn;
    if (!clusterName) return getMessage("readiness.compute.empty");

    const resources = [compute?.nodes, compute?.ppn].every((value) => value)
        ? `${compute.nodes}×${compute.ppn}`
        : undefined;

    return [clusterName, resources, compute?.timeLimit].filter(Boolean).join(" · ");
}

/**
 * Which published limits this configuration breaks. Empty when it breaks none,
 * or when the host published none to check against.
 *
 * The rail has to know this, not just the preflight: a green Compute step over a
 * preflight that refuses to submit is the designer contradicting itself, and the
 * reader would only find out at the last click.
 */
function getComputeLimitViolations(compute: any, clusterMetadata: ClusterMetadata[]): string[] {
    const limits = findClusterMetadata(compute, clusterMetadata)?.limits;
    if (!limits) return [];

    const walltimeHours = parseWalltimeHours(compute?.timeLimit);
    const violations: string[] = [];

    if (limits.maxNodes !== undefined && (compute?.nodes ?? 0) > limits.maxNodes) {
        violations.push(getMessage("readiness.compute.overNodes", { limit: limits.maxNodes }));
    }
    if (limits.maxPpn !== undefined && (compute?.ppn ?? 0) > limits.maxPpn) {
        violations.push(getMessage("readiness.compute.overPpn", { limit: limits.maxPpn }));
    }
    if (
        limits.maxWalltimeHours !== undefined &&
        walltimeHours !== undefined &&
        walltimeHours > limits.maxWalltimeHours
    ) {
        violations.push(
            getMessage("readiness.compute.overWalltime", { limit: limits.maxWalltimeHours }),
        );
    }

    return violations;
}

/**
 * Steps for creating the job. After submission these stay in the rail but stop
 * being things to do — they become the record of what was run.
 */
function getCreationSteps({
    job,
    materials,
    isUsingMaterials,
    datasetConfig,
    parentJobName,
    clusterMetadata,
}: {
    job: JobReadinessOptions["job"];
    materials: any[];
    isUsingMaterials: boolean;
    datasetConfig?: { name?: string } | null;
    parentJobName?: string;
    clusterMetadata: ClusterMetadata[];
}): ReadinessStep[] {
    const steps: ReadinessStep[] = [];

    if (isUsingMaterials) {
        const hasMaterial = materials.length > 0 || Boolean(parentJobName);
        steps.push({
            id: "material",
            label: getMessage("readiness.material.label"),
            state: hasMaterial ? "complete" : "empty",
            summary: describeMaterials(materials, parentJobName),
        });
    } else {
        steps.push({
            id: "dataset",
            label: getMessage("readiness.dataset.label"),
            state: datasetConfig ? "complete" : "empty",
            summary: datasetConfig?.name ?? getMessage("readiness.dataset.empty"),
        });
    }

    const hasWorkflow = Boolean(job.workflow?.subworkflows?.length);
    steps.push({
        id: "workflow",
        label: getMessage("readiness.workflow.label"),
        state: hasWorkflow ? "complete" : "empty",
        summary: describeWorkflow(job.workflow),
    });

    const hasCompute = Boolean(job.compute?.cluster?.fqdn);
    const violations = hasCompute ? getComputeLimitViolations(job.compute, clusterMetadata) : [];
    steps.push({
        id: "compute",
        label: getMessage("readiness.compute.label"),
        state: hasCompute && !violations.length ? "complete" : "attention",
        summary: violations.length ? violations.join(" · ") : describeCompute(job.compute),
    });

    return steps;
}

/**
 * A configuration the cluster will reject is a blocker too, and the reader
 * should learn that from the Submit button rather than from the preflight after
 * they have decided they are done. Sits with the other compute blocker, ahead of
 * "Save the job", which is the one fixed without leaving the header.
 */
function withLimitBlocker(
    blockers: string[],
    steps: ReadinessStep[],
    hasCluster: boolean,
): string[] {
    const computeStep = steps.find((step) => step.id === "compute");
    if (!hasCluster || computeStep?.state !== "attention") return blockers;

    const limitBlocker = getMessage("blocker.computeLimits");
    const saveIndex = blockers.indexOf(getMessage("blocker.save"));
    if (saveIndex === -1) return [...blockers, limitBlocker];

    return [...blockers.slice(0, saveIndex), limitBlocker, ...blockers.slice(saveIndex)];
}

function getReviewState({
    editable,
    isSubmittable,
}: {
    editable: boolean;
    isSubmittable: boolean;
}): ReadinessState {
    // A read-only draft is somebody else's to submit; saying "ready" would invite
    // an action this reader cannot take.
    if (!editable) return "unavailable";

    return isSubmittable ? "complete" : "empty";
}

function getReviewSummary({
    editable,
    isSubmittable,
    blockingReasons,
}: {
    editable: boolean;
    isSubmittable: boolean;
    blockingReasons: string[];
}): string {
    if (!editable) return getMessage("readiness.review.viewOnly");
    if (isSubmittable) return getMessage("readiness.review.ready");

    return blockingReasons.length === 1
        ? getMessage("readiness.review.oneRemaining")
        : getMessage("readiness.review.remaining", { count: blockingReasons.length });
}

export function getJobReadiness({
    job,
    materials = [],
    isUsingMaterials = true,
    datasetConfig = null,
    editable = true,
    clusterMetadata = [],
}: JobReadinessOptions): JobReadiness {
    const parentJobName = (() => {
        try {
            return job.getParentJobClient?.()?.name ?? undefined;
        } catch {
            return undefined;
        }
    })();

    const isDraft = Boolean(job.isInInitialStatus);
    const isRunOrFinished = !isDraft;

    const steps = getCreationSteps({
        job,
        materials,
        isUsingMaterials,
        datasetConfig,
        parentJobName,
        clusterMetadata,
    });

    const blockingReasons = withLimitBlocker(
        getSubmitBlockers({ job, materials, isUsingMaterials }),
        steps,
        Boolean(job.compute?.cluster?.fqdn),
    );

    if (isRunOrFinished) {
        // The job is out of the reader's hands: the creation steps are now a record
        // of what ran, and what matters is what it is doing.
        steps.push({
            id: "results",
            label: getMessage(
                job.isInFinalStatus ? "readiness.results.label" : "readiness.monitor.label",
            ),
            state: "complete",
            summary: getMessage(
                job.isInFinalStatus ? "readiness.results.summary" : "readiness.monitor.running",
            ),
        });
        steps.push({
            id: "files",
            label: getMessage("readiness.files.label"),
            state: "complete",
            summary: getMessage("readiness.files.summary"),
        });

        return { steps, isSubmittable: false, blockingReasons: [], isRunOrFinished };
    }

    const isSubmittable = editable && blockingReasons.length === 0;

    steps.push({
        id: REVIEW_STEP_ID,
        label: getMessage("readiness.review.label"),
        state: getReviewState({ editable, isSubmittable }),
        summary: getReviewSummary({ editable, isSubmittable, blockingReasons }),
    });

    return { steps, isSubmittable, blockingReasons, isRunOrFinished };
}
