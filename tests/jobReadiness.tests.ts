import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getJobReadiness } from "../src/jobReadiness";

const readyJob = {
    id: "job-1",
    isInInitialStatus: true,
    workflow: { name: "Band structure", subworkflows: [{ units: [{}, {}] }] },
    compute: {
        cluster: { fqdn: "cluster-1.mat3ra.com" },
        nodes: 1,
        ppn: 16,
        timeLimit: "04:00:00",
    },
};

const stepIds = (readiness: ReturnType<typeof getJobReadiness>) =>
    readiness.steps.map((step) => step.id);
const stepById = (readiness: ReturnType<typeof getJobReadiness>, id: string) =>
    readiness.steps.find((step) => step.id === id);

describe("getJobReadiness — creation shapes", () => {
    it("walks a material job from material to review", () => {
        const readiness = getJobReadiness({ job: readyJob, materials: [{ formula: "Si2" }] });
        assert.deepEqual(stepIds(readiness), ["material", "workflow", "compute", "review"]);
        assert.equal(readiness.isSubmittable, true);
        assert.equal(stepById(readiness, "review")?.summary, "Ready to submit");
    });

    it("puts a dataset in the material step's place for dataset-driven jobs", () => {
        const readiness = getJobReadiness({
            job: readyJob,
            isUsingMaterials: false,
            datasetConfig: { name: "training-set-a" },
        });
        assert.ok(stepIds(readiness).includes("dataset"));
        assert.ok(!stepIds(readiness).includes("material"));
        assert.equal(stepById(readiness, "dataset")?.summary, "training-set-a");
        // A dataset job is not missing a material.
        assert.equal(readiness.isSubmittable, true);
    });

    it("treats a parent job as supplying the material", () => {
        // Otherwise a parent-derived job reads as "no material selected" — the job
        // inherits one, and the reader is told to go fix something that is fine.
        const job = { ...readyJob, getParentJobClient: () => ({ name: "relaxation-run" }) };
        const readiness = getJobReadiness({ job, materials: [] });
        assert.equal(stepById(readiness, "material")?.state, "complete");
        assert.equal(stepById(readiness, "material")?.summary, "From parent job relaxation-run");
    });

    it("states the batch consequence for a multi-material job", () => {
        const readiness = getJobReadiness({
            job: readyJob,
            materials: [{ formula: "Si2" }, { formula: "Ge2" }, { formula: "GaN" }],
        });
        assert.equal(stepById(readiness, "material")?.summary, "3 materials — runs 3 times");
    });

    it("counts what is missing rather than just refusing", () => {
        const readiness = getJobReadiness({
            job: { isInInitialStatus: true, workflow: { subworkflows: [] }, compute: null },
            materials: [],
        });
        assert.equal(readiness.isSubmittable, false);
        assert.equal(stepById(readiness, "review")?.summary, "4 steps remaining");
        assert.deepEqual(readiness.blockingReasons, [
            "Select a material",
            "Select a workflow",
            "Configure compute",
            "Save the job",
        ]);
    });

    it("summarises compute rather than only marking it done", () => {
        const readiness = getJobReadiness({ job: readyJob, materials: [{}] });
        assert.equal(
            stepById(readiness, "compute")?.summary,
            "cluster-1.mat3ra.com · 1×16 · 04:00:00",
        );
    });
});

describe("getJobReadiness — lifecycle", () => {
    it("switches to monitoring once the job has left draft", () => {
        // This replaces the status-based tab jumping in Job.jsx#defaultTab.
        const running = { ...readyJob, isInInitialStatus: false };
        const readiness = getJobReadiness({ job: running, materials: [{}] });
        assert.ok(stepIds(readiness).includes("results"));
        assert.ok(stepIds(readiness).includes("files"));
        assert.equal(stepById(readiness, "results")?.label, "Monitor");
        assert.equal(readiness.isRunOrFinished, true);
        assert.equal(readiness.isSubmittable, false);
    });

    it("calls the step Results once the job is finished", () => {
        const finished = { ...readyJob, isInInitialStatus: false, isInFinalStatus: true };
        const readiness = getJobReadiness({ job: finished, materials: [{}] });
        assert.equal(stepById(readiness, "results")?.label, "Results");
    });

    it("reports no blockers for a job that already ran", () => {
        // "Save the job" is meaningless advice for something already submitted.
        const running = { ...readyJob, id: undefined, isInInitialStatus: false };
        const readiness = getJobReadiness({ job: running, materials: [] });
        assert.deepEqual(readiness.blockingReasons, []);
    });

    it("renders view-only for a job this reader cannot edit", () => {
        const readiness = getJobReadiness({
            job: readyJob,
            materials: [{}],
            editable: false,
        });
        assert.equal(readiness.isSubmittable, false);
        assert.equal(stepById(readiness, "review")?.state, "unavailable");
        assert.equal(stepById(readiness, "review")?.summary, "View only");
    });
});

describe("getJobReadiness — cluster limits", () => {
    const clusterMetadata = [
        {
            fqdn: "cluster-1.mat3ra.com",
            limits: { maxNodes: 4, maxPpn: 32, maxWalltimeHours: 12 },
        },
    ];

    it("flags a walltime over the queue cap on the compute step", () => {
        // Otherwise the rail shows Compute complete while the preflight refuses
        // to submit, and the reader only finds out at the last click.
        const job = { ...readyJob, compute: { ...readyJob.compute, timeLimit: "24:00:00" } };
        const readiness = getJobReadiness({ job, materials: [{}], clusterMetadata });
        assert.equal(stepById(readiness, "compute")?.state, "attention");
        assert.equal(stepById(readiness, "compute")?.summary, "over the 12 h queue limit");
        assert.equal(readiness.isSubmittable, false);
        assert.ok(readiness.blockingReasons.includes("Bring compute within the cluster's limits"));
    });

    it("lists every limit it breaks, not just the first", () => {
        const job = {
            ...readyJob,
            compute: { ...readyJob.compute, nodes: 8, ppn: 64, timeLimit: "24:00:00" },
        };
        const readiness = getJobReadiness({ job, materials: [{}], clusterMetadata });
        assert.equal(
            stepById(readiness, "compute")?.summary,
            "over the 4-node limit · over 32 cores per node · over the 12 h queue limit",
        );
    });

    it("does not invent limits the host never published", () => {
        const job = { ...readyJob, compute: { ...readyJob.compute, nodes: 999 } };
        const readiness = getJobReadiness({ job, materials: [{}] });
        assert.equal(stepById(readiness, "compute")?.state, "complete");
        assert.equal(readiness.isSubmittable, true);
    });

    it("keeps the limit blocker ahead of Save, which is fixed without leaving", () => {
        const job = {
            ...readyJob,
            id: undefined,
            compute: { ...readyJob.compute, timeLimit: "24:00:00" },
        };
        const readiness = getJobReadiness({ job, materials: [{}], clusterMetadata });
        assert.deepEqual(readiness.blockingReasons, [
            "Bring compute within the cluster's limits",
            "Save the job",
        ]);
    });
});

describe("getJobReadiness — robustness", () => {
    it("survives a parent lookup that throws", () => {
        const job = {
            ...readyJob,
            getParentJobClient: () => {
                throw new Error("DAO miss");
            },
        };
        assert.doesNotThrow(() => getJobReadiness({ job, materials: [{}] }));
    });

    it("does not touch the job entity", () => {
        // Readiness must never trigger job.render(); Job.jsx owns that, and a
        // compute keystroke must not drag a workflow re-render along.
        const calls: string[] = [];
        const job = {
            ...readyJob,
            get render() {
                calls.push("render");
                return () => undefined;
            },
        };
        getJobReadiness({ job: job as never, materials: [{}] });
        assert.deepEqual(calls, []);
    });
});
