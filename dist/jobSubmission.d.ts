/**
 * What still stands between a job and being submitted.
 *
 * Submit used to be one item among several in a dropdown, shown or hidden by a
 * single `job.id && job.isInInitialStatus` check. Hidden is the worst of the
 * three states a control can be in: the reader cannot act on it and is not told
 * why. Promoting Submit to the header means it is always visible, which in turn
 * means it has to be able to explain itself when it is not available.
 *
 * Kept as a pure function of the job so it can be unit-tested and reused: the
 * readiness rail and the submit preflight (SOF-8023 phases 2.1 and 2.4) need the
 * same answer, and the three must never disagree about whether a job is ready.
 */
/** Minimal shape this module needs; the real entity is jode's `Job`. */
export interface SubmittableJob {
    id?: string;
    isInInitialStatus?: boolean;
    isInRunningStatus?: boolean;
    workflow?: {
        subworkflows?: unknown[];
        isUsingDataset?: boolean;
    };
    compute?: {
        cluster?: {
            fqdn?: string;
        };
    } | null;
}
export interface SubmitBlockersOptions {
    job: SubmittableJob;
    /** Materials currently attached; empty for dataset-driven jobs. */
    materials?: unknown[];
    /** False for dataset jobs, where materials are not the input. */
    isUsingMaterials?: boolean;
}
/**
 * Reasons the job cannot be submitted, in the order a reader would fix them.
 * Empty means ready. Each string is shown to the reader verbatim, so it names
 * what to do, not what is wrong internally.
 */
export declare function getSubmitBlockers({ job, materials, isUsingMaterials, }: SubmitBlockersOptions): string[];
export declare function isJobSubmittable(options: SubmitBlockersOptions): boolean;
/**
 * One line for a disabled Submit button. Names the first thing to fix and how
 * much else is waiting, rather than listing everything in a tooltip nobody
 * reads to the end.
 *
 * Takes the list rather than the job so the button can be driven by
 * `getJobReadiness`, which knows about blockers this module cannot see — cluster
 * limits come from host-injected metadata, and a Submit button that stayed
 * enabled over a preflight that refuses would be the designer contradicting
 * itself.
 */
export declare function formatBlockedReason(blockers: string[]): string | null;
/** The same line, for callers holding a job rather than a readiness report. */
export declare function getSubmitBlockedReason(options: SubmitBlockersOptions): string | null;
//# sourceMappingURL=jobSubmission.d.ts.map