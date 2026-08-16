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
/**
 * Reasons the job cannot be submitted, in the order a reader would fix them.
 * Empty means ready. Each string is shown to the reader verbatim, so it names
 * what to do, not what is wrong internally.
 */
export function getSubmitBlockers({ job, materials = [], isUsingMaterials = true, }) {
    var _a, _b, _c, _d;
    const blockers = [];
    if (isUsingMaterials && materials.length === 0) {
        blockers.push("Select a material");
    }
    if (!((_b = (_a = job.workflow) === null || _a === void 0 ? void 0 : _a.subworkflows) === null || _b === void 0 ? void 0 : _b.length)) {
        blockers.push("Select a workflow");
    }
    if (!((_d = (_c = job.compute) === null || _c === void 0 ? void 0 : _c.cluster) === null || _d === void 0 ? void 0 : _d.fqdn)) {
        blockers.push("Configure compute");
    }
    // Last, because it is the one the reader fixes by pressing the button next
    // to Submit rather than by going somewhere else.
    if (!job.id) {
        blockers.push("Save the job");
    }
    return blockers;
}
export function isJobSubmittable(options) {
    return Boolean(options.job.isInInitialStatus) && getSubmitBlockers(options).length === 0;
}
/**
 * One line for a disabled Submit button. Names the first thing to fix and how
 * much else is waiting, rather than listing everything in a tooltip nobody
 * reads to the end.
 */
export function getSubmitBlockedReason(options) {
    const blockers = getSubmitBlockers(options);
    if (blockers.length === 0)
        return null;
    if (blockers.length === 1)
        return blockers[0];
    return `${blockers[0]} (+${blockers.length - 1} more)`;
}
