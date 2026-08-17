import type { ClusterMetadata, ComputeQuota } from "../computeEstimate";
import type { SubmittableJob } from "../jobSubmission";
export type PreflightState = 
/** Nothing wrong. */
"pass"
/** Submittable, but the reader should know. Requires acknowledgement. */
 | "warn"
/** Blocks submission. */
 | "fail"
/** Could not be judged — no data, or the check itself failed. Never blocks. */
 | "skip";
/** Where a failing row sends the reader to fix it. */
export interface PreflightFix {
    label: string;
    /** A `ReadinessStep.id`, so the rail and the dialog agree on where to land. */
    stepId: string;
}
export interface PreflightRow {
    id: string;
    label: string;
    state: PreflightState;
    /** One line naming what was checked and what was found. */
    detail: string;
    /** Longer explanation, shown behind "Details". */
    explanation?: string;
    fix?: PreflightFix;
}
export interface PreflightReport {
    rows: PreflightRow[];
    /** Ids of `fail` rows, in the order to fix them. */
    failures: string[];
    /** Ids of `warn` rows, which must be acknowledged before submitting. */
    warnings: string[];
}
/** Everything a check may read. Checks must not reach outside it. */
export interface PreflightContext {
    job: SubmittableJob & {
        name?: string;
        compute?: any;
        workflow?: any;
        render?: () => void;
    };
    materials?: any[];
    isUsingMaterials?: boolean;
    clusterMetadata?: ClusterMetadata[];
    quota?: ComputeQuota | null;
}
/**
 * A check returns its row, or null to leave itself out of the report entirely
 * (as opposed to `skip`, which says "this was considered and could not be
 * judged"). Async so a host-injected check can ask a server about balance.
 */
export type PreflightCheck = (context: PreflightContext) => Promise<PreflightRow | null>;
//# sourceMappingURL=types.d.ts.map