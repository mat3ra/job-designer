/**
 * What a compute configuration will consume, and what that costs.
 *
 * The designer asks for nodes, cores and a walltime and says nothing about what
 * they add up to. The same arithmetic is needed in three places — the context
 * strip's estimate chip, the submit preflight's budget check, and the compute
 * estimate panel — so it lives here once. Three surfaces disagreeing about how
 * much a job costs would be worse than none of them saying anything.
 *
 * TODO(SOF-8023): this is a copy. The canonical implementation is
 * `@mat3ra/ive`'s `utils/computeEstimate`, beside the form that holds the live
 * values; it is duplicated here only because the ive release carrying it has not
 * shipped yet. Delete this module and import from ive once it has — the two are
 * identical today and must not be allowed to drift.
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
    cluster?: { fqdn?: string } | null;
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
export function parseWalltimeHours(timeLimit?: string | number): number | undefined {
    if (typeof timeLimit === "number") return Number.isFinite(timeLimit) ? timeLimit : undefined;
    if (!timeLimit) return undefined;

    const [dayPart, clockPart] = timeLimit.includes("-")
        ? timeLimit.split("-")
        : [undefined, timeLimit];

    const segments = clockPart.split(":").map((segment) => Number(segment));
    if (!segments.length || segments.some((segment) => !Number.isFinite(segment))) return undefined;

    const [hours = 0, minutes = 0, seconds = 0] = segments;
    const days = dayPart === undefined ? 0 : Number(dayPart);
    if (!Number.isFinite(days)) return undefined;

    return days * 24 + hours + minutes / 60 + seconds / 3600;
}

/** Cluster metadata for the cluster this compute points at, if the host gave any. */
export function findClusterMetadata(
    compute?: ComputeConfiguration | null,
    clusterMetadata: ClusterMetadata[] = [],
): ClusterMetadata | undefined {
    const fqdn = compute?.cluster?.fqdn;
    if (!fqdn) return undefined;

    return clusterMetadata.find((cluster) => cluster.fqdn === fqdn);
}

/**
 * Core-hours and cost for one run. Multi-material jobs run once per material —
 * pass `runs` so the estimate is what the account will actually be charged
 * rather than the per-material figure.
 */
export function estimateComputeUsage(
    compute?: ComputeConfiguration | null,
    clusterMetadata: ClusterMetadata[] = [],
    runs = 1,
): ComputeEstimate {
    const walltimeHours = parseWalltimeHours(compute?.timeLimit);
    const { nodes, ppn } = compute ?? {};

    const estimate: ComputeEstimate = { walltimeHours, nodes, ppn };

    if (!nodes || !ppn || walltimeHours === undefined) return estimate;

    estimate.coreHours = nodes * ppn * walltimeHours * Math.max(runs, 1);

    const cluster = findClusterMetadata(compute, clusterMetadata);
    if (cluster?.pricePerCoreHour !== undefined) {
        estimate.cost = estimate.coreHours * cluster.pricePerCoreHour;
        estimate.currency = cluster.currency;
    }

    return estimate;
}

function formatNumber(value: number): string {
    // Core-hours below 10 are the interesting ones to see a decimal on; above
    // that the fraction is noise next to a queue that rounds to the minute.
    return value >= 10 ? String(Math.round(value)) : String(Math.round(value * 10) / 10);
}

export function formatCoreHours(coreHours?: number): string | undefined {
    if (coreHours === undefined) return undefined;

    return `${formatNumber(coreHours)} core·h`;
}

export function formatCost(cost?: number, currency?: string): string | undefined {
    if (cost === undefined) return undefined;

    const amount = cost >= 10 ? cost.toFixed(0) : cost.toFixed(2);
    if (!currency) return amount;

    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
            maximumFractionDigits: cost >= 10 ? 0 : 2,
        }).format(cost);
    } catch {
        // An unknown currency code must not take the estimate down with it.
        return `${amount} ${currency}`;
    }
}

/** One line for a chip or a summary row. Undefined when nothing is known yet. */
export function formatEstimate(estimate: ComputeEstimate): string | undefined {
    const coreHours = formatCoreHours(estimate.coreHours);
    if (!coreHours) return undefined;

    const cost = formatCost(estimate.cost, estimate.currency);

    return cost ? `${coreHours} ≈ ${cost}` : coreHours;
}
