import { findClusterMetadata, parseWalltimeHours } from "./computeEstimate";
import { getSubmitBlockers } from "./jobSubmission";
const REVIEW_STEP_ID = "review";
function describeMaterials(materials, parentJobName) {
    var _a, _b;
    if (parentJobName)
        return `From parent job ${parentJobName}`;
    if (materials.length === 0)
        return "No material selected";
    if (materials.length === 1) {
        const [material] = materials;
        return (_b = (_a = material === null || material === void 0 ? void 0 : material.formula) !== null && _a !== void 0 ? _a : material === null || material === void 0 ? void 0 : material.name) !== null && _b !== void 0 ? _b : "1 material";
    }
    return `${materials.length} materials — runs ${materials.length} times`;
}
function describeWorkflow(workflow) {
    var _a, _b;
    const subworkflows = (_a = workflow === null || workflow === void 0 ? void 0 : workflow.subworkflows) !== null && _a !== void 0 ? _a : [];
    if (!subworkflows.length)
        return "No workflow selected";
    const unitCount = subworkflows.reduce((total, subworkflow) => { var _a, _b; return total + ((_b = (_a = subworkflow === null || subworkflow === void 0 ? void 0 : subworkflow.units) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0); }, 0);
    const name = (_b = workflow === null || workflow === void 0 ? void 0 : workflow.name) !== null && _b !== void 0 ? _b : `${subworkflows.length} subworkflows`;
    return unitCount ? `${name} · ${unitCount} units` : name;
}
function describeCompute(compute) {
    var _a;
    const clusterName = (_a = compute === null || compute === void 0 ? void 0 : compute.cluster) === null || _a === void 0 ? void 0 : _a.fqdn;
    if (!clusterName)
        return "Cluster and resources needed";
    const resources = [compute === null || compute === void 0 ? void 0 : compute.nodes, compute === null || compute === void 0 ? void 0 : compute.ppn].every((value) => value)
        ? `${compute.nodes}×${compute.ppn}`
        : undefined;
    return [clusterName, resources, compute === null || compute === void 0 ? void 0 : compute.timeLimit].filter(Boolean).join(" · ");
}
/**
 * Which published limits this configuration breaks. Empty when it breaks none,
 * or when the host published none to check against.
 *
 * The rail has to know this, not just the preflight: a green Compute step over a
 * preflight that refuses to submit is the designer contradicting itself, and the
 * reader would only find out at the last click.
 */
function getComputeLimitViolations(compute, clusterMetadata) {
    var _a, _b, _c;
    const limits = (_a = findClusterMetadata(compute, clusterMetadata)) === null || _a === void 0 ? void 0 : _a.limits;
    if (!limits)
        return [];
    const walltimeHours = parseWalltimeHours(compute === null || compute === void 0 ? void 0 : compute.timeLimit);
    const violations = [];
    if (limits.maxNodes !== undefined && ((_b = compute === null || compute === void 0 ? void 0 : compute.nodes) !== null && _b !== void 0 ? _b : 0) > limits.maxNodes) {
        violations.push(`over the ${limits.maxNodes}-node limit`);
    }
    if (limits.maxPpn !== undefined && ((_c = compute === null || compute === void 0 ? void 0 : compute.ppn) !== null && _c !== void 0 ? _c : 0) > limits.maxPpn) {
        violations.push(`over ${limits.maxPpn} cores per node`);
    }
    if (limits.maxWalltimeHours !== undefined &&
        walltimeHours !== undefined &&
        walltimeHours > limits.maxWalltimeHours) {
        violations.push(`over the ${limits.maxWalltimeHours} h queue limit`);
    }
    return violations;
}
/**
 * Steps for creating the job. After submission these stay in the rail but stop
 * being things to do — they become the record of what was run.
 */
function getCreationSteps({ job, materials, isUsingMaterials, datasetConfig, parentJobName, clusterMetadata, }) {
    var _a, _b, _c, _d, _e;
    const steps = [];
    if (isUsingMaterials) {
        const hasMaterial = materials.length > 0 || Boolean(parentJobName);
        steps.push({
            id: "material",
            label: "Material",
            state: hasMaterial ? "complete" : "empty",
            summary: describeMaterials(materials, parentJobName),
        });
    }
    else {
        steps.push({
            id: "dataset",
            label: "Dataset",
            state: datasetConfig ? "complete" : "empty",
            summary: (_a = datasetConfig === null || datasetConfig === void 0 ? void 0 : datasetConfig.name) !== null && _a !== void 0 ? _a : "No dataset selected",
        });
    }
    const hasWorkflow = Boolean((_c = (_b = job.workflow) === null || _b === void 0 ? void 0 : _b.subworkflows) === null || _c === void 0 ? void 0 : _c.length);
    steps.push({
        id: "workflow",
        label: "Workflow",
        state: hasWorkflow ? "complete" : "empty",
        summary: describeWorkflow(job.workflow),
    });
    const hasCompute = Boolean((_e = (_d = job.compute) === null || _d === void 0 ? void 0 : _d.cluster) === null || _e === void 0 ? void 0 : _e.fqdn);
    const violations = hasCompute ? getComputeLimitViolations(job.compute, clusterMetadata) : [];
    steps.push({
        id: "compute",
        label: "Compute",
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
function withLimitBlocker(blockers, steps, hasCluster) {
    const computeStep = steps.find((step) => step.id === "compute");
    if (!hasCluster || (computeStep === null || computeStep === void 0 ? void 0 : computeStep.state) !== "attention")
        return blockers;
    const limitBlocker = "Bring compute within the cluster's limits";
    const saveIndex = blockers.indexOf("Save the job");
    if (saveIndex === -1)
        return [...blockers, limitBlocker];
    return [...blockers.slice(0, saveIndex), limitBlocker, ...blockers.slice(saveIndex)];
}
function getReviewState({ editable, isSubmittable, }) {
    // A read-only draft is somebody else's to submit; saying "ready" would invite
    // an action this reader cannot take.
    if (!editable)
        return "unavailable";
    return isSubmittable ? "complete" : "empty";
}
function getReviewSummary({ editable, isSubmittable, blockingReasons, }) {
    if (!editable)
        return "View only";
    if (isSubmittable)
        return "Ready to submit";
    return blockingReasons.length === 1
        ? "1 step remaining"
        : `${blockingReasons.length} steps remaining`;
}
export function getJobReadiness({ job, materials = [], isUsingMaterials = true, datasetConfig = null, editable = true, clusterMetadata = [], }) {
    var _a, _b;
    const parentJobName = (() => {
        var _a, _b, _c;
        try {
            return (_c = (_b = (_a = job.getParentJobClient) === null || _a === void 0 ? void 0 : _a.call(job)) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : undefined;
        }
        catch (_d) {
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
    const blockingReasons = withLimitBlocker(getSubmitBlockers({ job, materials, isUsingMaterials }), steps, Boolean((_b = (_a = job.compute) === null || _a === void 0 ? void 0 : _a.cluster) === null || _b === void 0 ? void 0 : _b.fqdn));
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
