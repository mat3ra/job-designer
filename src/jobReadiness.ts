import { getSubmitBlockers, type SubmittableJob } from "./jobSubmission";

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
}

const REVIEW_STEP_ID = "review";

function describeMaterials(materials: any[], parentJobName?: string): string {
    if (parentJobName) return `From parent job ${parentJobName}`;
    if (materials.length === 0) return "No material selected";
    if (materials.length === 1) {
        const [material] = materials;
        return material?.formula ?? material?.name ?? "1 material";
    }

    return `${materials.length} materials — runs ${materials.length} times`;
}

function describeWorkflow(workflow: any): string {
    const subworkflows = workflow?.subworkflows ?? [];
    if (!subworkflows.length) return "No workflow selected";

    const unitCount = subworkflows.reduce(
        (total: number, subworkflow: any) => total + (subworkflow?.units?.length ?? 0),
        0,
    );
    const name = workflow?.name ?? `${subworkflows.length} subworkflows`;

    return unitCount ? `${name} · ${unitCount} units` : name;
}

function describeCompute(compute: any): string {
    const clusterName = compute?.cluster?.fqdn;
    if (!clusterName) return "Cluster and resources needed";

    const resources = [compute?.nodes, compute?.ppn].every((value) => value)
        ? `${compute.nodes}×${compute.ppn}`
        : undefined;

    return [clusterName, resources, compute?.timeLimit].filter(Boolean).join(" · ");
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
}: {
    job: JobReadinessOptions["job"];
    materials: any[];
    isUsingMaterials: boolean;
    datasetConfig?: { name?: string } | null;
    parentJobName?: string;
}): ReadinessStep[] {
    const steps: ReadinessStep[] = [];

    if (isUsingMaterials) {
        const hasMaterial = materials.length > 0 || Boolean(parentJobName);
        steps.push({
            id: "material",
            label: "Material",
            state: hasMaterial ? "complete" : "empty",
            summary: describeMaterials(materials, parentJobName),
        });
    } else {
        steps.push({
            id: "dataset",
            label: "Dataset",
            state: datasetConfig ? "complete" : "empty",
            summary: datasetConfig?.name ?? "No dataset selected",
        });
    }

    const hasWorkflow = Boolean(job.workflow?.subworkflows?.length);
    steps.push({
        id: "workflow",
        label: "Workflow",
        state: hasWorkflow ? "complete" : "empty",
        summary: describeWorkflow(job.workflow),
    });

    const hasCompute = Boolean(job.compute?.cluster?.fqdn);
    steps.push({
        id: "compute",
        label: "Compute",
        state: hasCompute ? "complete" : "attention",
        summary: describeCompute(job.compute),
    });

    return steps;
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
    if (!editable) return "View only";
    if (isSubmittable) return "Ready to submit";

    return blockingReasons.length === 1
        ? "1 step remaining"
        : `${blockingReasons.length} steps remaining`;
}

export function getJobReadiness({
    job,
    materials = [],
    isUsingMaterials = true,
    datasetConfig = null,
    editable = true,
}: JobReadinessOptions): JobReadiness {
    const parentJobName = (() => {
        try {
            return job.getParentJobClient?.()?.name ?? undefined;
        } catch {
            return undefined;
        }
    })();

    const blockingReasons = getSubmitBlockers({ job, materials, isUsingMaterials });
    const isDraft = Boolean(job.isInInitialStatus);
    const isRunOrFinished = !isDraft;

    const steps = getCreationSteps({
        job,
        materials,
        isUsingMaterials,
        datasetConfig,
        parentJobName,
    });

    if (isRunOrFinished) {
        // The job is out of the reader's hands: the creation steps are now a record
        // of what ran, and what matters is what it is doing.
        steps.push({
            id: "results",
            label: job.isInFinalStatus ? "Results" : "Monitor",
            state: "complete",
            summary: job.isInFinalStatus ? "Outputs and properties" : "Running",
        });
        steps.push({ id: "files", label: "Files", state: "complete", summary: "Job directory" });

        return { steps, isSubmittable: false, blockingReasons: [], isRunOrFinished };
    }

    const isSubmittable = editable && blockingReasons.length === 0;

    steps.push({
        id: REVIEW_STEP_ID,
        label: "Review & submit",
        state: getReviewState({ editable, isSubmittable }),
        summary: getReviewSummary({ editable, isSubmittable, blockingReasons }),
    });

    return { steps, isSubmittable, blockingReasons, isRunOrFinished };
}
