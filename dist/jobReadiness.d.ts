import { type SubmittableJob } from "./jobSubmission";
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
"complete"
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
        getParentJobClient?: () => {
            name?: string;
        } | null;
        compute?: any;
        workflow?: any;
    };
    materials?: any[];
    /** False for dataset-driven jobs, where a dataset takes the place of materials. */
    isUsingMaterials?: boolean;
    datasetConfig?: {
        name?: string;
    } | null;
    /** False for shared or finished jobs: the rail renders view-only. */
    editable?: boolean;
}
export declare function getJobReadiness({ job, materials, isUsingMaterials, datasetConfig, editable, }: JobReadinessOptions): JobReadiness;
//# sourceMappingURL=jobReadiness.d.ts.map