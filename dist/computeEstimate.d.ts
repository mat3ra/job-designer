/**
 * What a compute configuration will consume, and what that costs.
 *
 * The designer asks for nodes, cores and a walltime and says nothing about what
 * they add up to. The same arithmetic is needed in three places — the context
 * strip's estimate chip, the submit preflight's budget check, and the compute
 * estimate panel — so it lives here once. Three surfaces disagreeing about how
 * much a job costs would be worse than none of them saying anything.
 *
 * Pricing, limits and quota are not in the job document: they are properties of
 * the cluster and the account, injected by the host through `setDependencies()`
 * (see {@link ClusterMetadata}). Everything here degrades when that metadata is
 * absent — core-hours are always computable from the job alone, cost is not, and
 * an absent cost is reported as absent rather than as zero.
 */
/** Per-cluster enrichment the host may inject. Every field is optional. */
export interface ClusterMetadata {
    /** Matches `compute.cluster.fqdn`. */
    fqdn?: string;
    /** Human name, when the host has a nicer one than the FQDN. */
    name?: string;
    pricePerCoreHour?: number;
    /** ISO 4217, e.g. "USD". Only used for display. */
    currency?: string;
    limits?: ClusterLimits;
    /** Typical wait before the job starts, in minutes. */
    queueWaitMinutes?: number;
}
export interface ClusterLimits {
    maxNodes?: number;
    maxPpn?: number;
    /** Queue walltime cap, in hours. */
    maxWalltimeHours?: number;
}
/** Remaining allowance for the account paying for this job. */
export interface ComputeQuota {
    remainingCoreHours?: number;
    totalCoreHours?: number;
    remainingBalance?: number;
    currency?: string;
}
export interface ComputeEstimate {
    /** nodes × cores-per-node × walltime hours. Undefined when a term is missing. */
    coreHours?: number;
    /** Only when the cluster carries a price. */
    cost?: number;
    currency?: string;
    walltimeHours?: number;
    nodes?: number;
    ppn?: number;
}
/** The compute half of a job, as the designer holds it. */
export interface ComputeConfiguration {
    cluster?: {
        fqdn?: string;
    } | null;
    nodes?: number;
    ppn?: number;
    timeLimit?: string;
    queue?: string;
}
/**
 * Walltime as hours. Accepts the `HH:MM:SS` and `D-HH:MM:SS` forms the compute
 * form produces, and a bare number of hours. Returns undefined for anything it
 * cannot read, so callers can tell "no walltime" from "zero hours".
 */
export declare function parseWalltimeHours(timeLimit?: string | number): number | undefined;
/** Cluster metadata for the cluster this compute points at, if the host gave any. */
export declare function findClusterMetadata(compute?: ComputeConfiguration | null, clusterMetadata?: ClusterMetadata[]): ClusterMetadata | undefined;
/**
 * Core-hours and cost for one run. Multi-material jobs run once per material —
 * pass `runs` so the estimate is what the account will actually be charged
 * rather than the per-material figure.
 */
export declare function estimateComputeUsage(compute?: ComputeConfiguration | null, clusterMetadata?: ClusterMetadata[], runs?: number): ComputeEstimate;
export declare function formatCoreHours(coreHours?: number): string | undefined;
export declare function formatCost(cost?: number, currency?: string): string | undefined;
/** One line for a chip or a summary row. Undefined when nothing is known yet. */
export declare function formatEstimate(estimate: ComputeEstimate): string | undefined;
//# sourceMappingURL=computeEstimate.d.ts.map