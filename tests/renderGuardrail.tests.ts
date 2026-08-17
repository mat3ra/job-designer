import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { estimateComputeUsage, formatEstimate } from "../src/computeEstimate";
import { getJobReadiness } from "../src/jobReadiness";
import { getSubmitBlockers } from "../src/jobSubmission";
import { checkBudget, checkComputeLimits, checkInputs, runPreflightChecks } from "../src/preflight";

/**
 * `job.render()` renders every unit's input templates. It is the single most
 * expensive thing the designer does, and `Job.jsx`'s update machinery —
 * `shouldComponentUpdate` mixins, `renderGeneration`, `persistJob()` — is built
 * around calling it as rarely as possible.
 *
 * The guided designer recomputes readiness, the estimate and the submit blockers
 * on every render, which means on every keystroke in the compute form. If any of
 * those touched the entity, typing a walltime would re-render the workflow.
 * These tests count the calls, so that regression cannot land quietly.
 *
 * The one deliberate exception is the preflight's workflow check: rendering is
 * how template errors surface at all, and submission would do it a moment later
 * anyway. It must render exactly once — not once per check.
 */

/** A job that counts what is asked of it. */
function makeSpyJob() {
    const calls: string[] = [];

    return {
        calls,
        job: {
            id: "job-1",
            isInInitialStatus: true,
            workflow: { name: "MD", subworkflows: [{ units: [{}, {}] }] },
            compute: {
                cluster: { fqdn: "cluster-1.mat3ra.com" },
                nodes: 1,
                ppn: 16,
                timeLimit: "04:00:00",
            },
            render: () => {
                calls.push("render");
            },
            setCompute: () => {
                calls.push("setCompute");
            },
            setWorkflow: () => {
                calls.push("setWorkflow");
            },
            setMaterial: () => {
                calls.push("setMaterial");
            },
        },
    };
}

const clusterMetadata = [
    {
        fqdn: "cluster-1.mat3ra.com",
        pricePerCoreHour: 0.08,
        currency: "USD",
        limits: { maxNodes: 4, maxPpn: 32, maxWalltimeHours: 12 },
    },
];

describe("a compute keystroke must not re-render the workflow", () => {
    it("readiness derivation never touches the entity", () => {
        const { job, calls } = makeSpyJob();
        getJobReadiness({ job: job as never, materials: [{}], clusterMetadata });
        assert.deepEqual(calls, []);
    });

    it("the estimate never touches the entity", () => {
        const { job, calls } = makeSpyJob();
        formatEstimate(estimateComputeUsage(job.compute, clusterMetadata, 3));
        assert.deepEqual(calls, []);
    });

    it("the submit blockers never touch the entity", () => {
        const { job, calls } = makeSpyJob();
        getSubmitBlockers({ job: job as never, materials: [{}] });
        assert.deepEqual(calls, []);
    });

    it("stays silent across a burst of edits, not just one", () => {
        // What a reader actually does: type into a walltime field. Each keystroke
        // re-renders Job.jsx, which recomputes all three of the above.
        const { job, calls } = makeSpyJob();
        ["0", "04", "04:", "04:0", "04:00", "04:00:0", "04:00:00"].forEach((timeLimit) => {
            const edited = { ...job, compute: { ...job.compute, timeLimit } };
            getJobReadiness({ job: edited as never, materials: [{}], clusterMetadata });
            estimateComputeUsage(edited.compute, clusterMetadata);
            getSubmitBlockers({ job: edited as never, materials: [{}] });
        });
        assert.deepEqual(calls, []);
    });
});

describe("the preflight renders once, deliberately", () => {
    it("renders exactly once for a whole report", async () => {
        const { job, calls } = makeSpyJob();
        await runPreflightChecks({
            job: job as never,
            materials: [{}],
            clusterMetadata,
            quota: { remainingCoreHours: 500, totalCoreHours: 1000 },
        });
        assert.deepEqual(calls, ["render"]);
    });

    it("no check other than the workflow one renders", async () => {
        const { job, calls } = makeSpyJob();
        const context = {
            job: job as never,
            materials: [{}],
            clusterMetadata,
            quota: { remainingCoreHours: 500 },
        };
        await checkInputs(context);
        await checkComputeLimits(context);
        await checkBudget(context);
        assert.deepEqual(calls, []);
    });

    it("does not render again when the reader re-runs the checks", async () => {
        // Two runs, two renders — one per run, never two per run.
        const { job, calls } = makeSpyJob();
        const context = { job: job as never, materials: [{}], clusterMetadata };
        await runPreflightChecks(context);
        await runPreflightChecks(context);
        assert.deepEqual(calls, ["render", "render"]);
    });
});
