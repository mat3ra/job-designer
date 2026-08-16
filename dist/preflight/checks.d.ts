import type { PreflightCheck, PreflightRow } from "./types";
/** The job runs on something: a material, a set of them, or a dataset. */
export declare const checkInputs: PreflightCheck;
/**
 * The workflow renders. This is the one check that touches the entity: rendering
 * is how template errors surface at all, and it is what submission would do a
 * moment later anyway — better to find out here, with a row pointing at the
 * workflow, than in a failed run.
 */
export declare const checkWorkflowRenders: PreflightCheck;
/**
 * Compute is set, and within the cluster's limits when the host told us what
 * they are. Without metadata this can still say whether a cluster and resources
 * were chosen — that part needs no host data.
 */
export declare const checkComputeLimits: PreflightCheck;
/**
 * What the run will consume against what is left. Skips rather than passes when
 * the host injected no quota — most deployments have none, and a green "Budget"
 * row backed by nothing would be a lie the reader has no way to check.
 */
export declare const checkBudget: PreflightCheck;
/**
 * The job exists server-side. Last, because unlike the others it is fixed with
 * the button next to Submit rather than by going to a step.
 */
export declare const checkSaved: PreflightCheck;
export declare const DEFAULT_PREFLIGHT_CHECKS: PreflightCheck[];
export type { PreflightRow };
//# sourceMappingURL=checks.d.ts.map