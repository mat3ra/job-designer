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
/**
 * Walltime as hours. Accepts the `HH:MM:SS` and `D-HH:MM:SS` forms the compute
 * form produces, and a bare number of hours. Returns undefined for anything it
 * cannot read, so callers can tell "no walltime" from "zero hours".
 */
export function parseWalltimeHours(timeLimit) {
    if (typeof timeLimit === "number")
        return Number.isFinite(timeLimit) ? timeLimit : undefined;
    if (!timeLimit)
        return undefined;
    const [dayPart, clockPart] = timeLimit.includes("-")
        ? timeLimit.split("-")
        : [undefined, timeLimit];
    const segments = clockPart.split(":").map((segment) => Number(segment));
    if (!segments.length || segments.some((segment) => !Number.isFinite(segment)))
        return undefined;
    const [hours = 0, minutes = 0, seconds = 0] = segments;
    const days = dayPart === undefined ? 0 : Number(dayPart);
    if (!Number.isFinite(days))
        return undefined;
    return days * 24 + hours + minutes / 60 + seconds / 3600;
}
/** Cluster metadata for the cluster this compute points at, if the host gave any. */
export function findClusterMetadata(compute, clusterMetadata = []) {
    var _a;
    const fqdn = (_a = compute === null || compute === void 0 ? void 0 : compute.cluster) === null || _a === void 0 ? void 0 : _a.fqdn;
    if (!fqdn)
        return undefined;
    return clusterMetadata.find((cluster) => cluster.fqdn === fqdn);
}
/**
 * Core-hours and cost for one run. Multi-material jobs run once per material —
 * pass `runs` so the estimate is what the account will actually be charged
 * rather than the per-material figure.
 */
export function estimateComputeUsage(compute, clusterMetadata = [], runs = 1) {
    const walltimeHours = parseWalltimeHours(compute === null || compute === void 0 ? void 0 : compute.timeLimit);
    const { nodes, ppn } = compute !== null && compute !== void 0 ? compute : {};
    const estimate = { walltimeHours, nodes, ppn };
    if (!nodes || !ppn || walltimeHours === undefined)
        return estimate;
    estimate.coreHours = nodes * ppn * walltimeHours * Math.max(runs, 1);
    const cluster = findClusterMetadata(compute, clusterMetadata);
    if ((cluster === null || cluster === void 0 ? void 0 : cluster.pricePerCoreHour) !== undefined) {
        estimate.cost = estimate.coreHours * cluster.pricePerCoreHour;
        estimate.currency = cluster.currency;
    }
    return estimate;
}
function formatNumber(value) {
    // Core-hours below 10 are the interesting ones to see a decimal on; above
    // that the fraction is noise next to a queue that rounds to the minute.
    return value >= 10 ? String(Math.round(value)) : String(Math.round(value * 10) / 10);
}
export function formatCoreHours(coreHours) {
    if (coreHours === undefined)
        return undefined;
    return `${formatNumber(coreHours)} core·h`;
}
export function formatCost(cost, currency) {
    if (cost === undefined)
        return undefined;
    const amount = cost >= 10 ? cost.toFixed(0) : cost.toFixed(2);
    if (!currency)
        return amount;
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
            maximumFractionDigits: cost >= 10 ? 0 : 2,
        }).format(cost);
    }
    catch (_a) {
        // An unknown currency code must not take the estimate down with it.
        return `${amount} ${currency}`;
    }
}
/** One line for a chip or a summary row. Undefined when nothing is known yet. */
export function formatEstimate(estimate) {
    const coreHours = formatCoreHours(estimate.coreHours);
    if (!coreHours)
        return undefined;
    const cost = formatCost(estimate.cost, estimate.currency);
    return cost ? `${coreHours} ≈ ${cost}` : coreHours;
}
