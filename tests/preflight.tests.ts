import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
    canSubmitFromReport,
    checkBudget,
    checkComputeLimits,
    checkInputs,
    checkWorkflowRenders,
    getReportSummary,
    type PreflightCheck,
    type PreflightContext,
    type PreflightReport,
    runPreflightChecks,
} from "../src/preflight";

const cluster = {
    fqdn: "cluster-007.mat3ra.com",
    pricePerCoreHour: 0.08,
    currency: "USD",
    limits: { maxNodes: 4, maxPpn: 32, maxWalltimeHours: 12 },
};

const readyContext = (): PreflightContext => ({
    job: {
        id: "job-1",
        isInInitialStatus: true,
        workflow: { name: "MD", subworkflows: [{ units: [{}, {}] }] },
        compute: { cluster: { fqdn: cluster.fqdn }, nodes: 1, ppn: 16, timeLimit: "04:00:00" },
        render: () => undefined,
    },
    materials: [{ formula: "Si2" }],
    clusterMetadata: [cluster],
});

const rowById = (report: PreflightReport, id: string) => report.rows.find((row) => row.id === id);

describe("runPreflightChecks", () => {
    it("passes every check for a job that is ready", async () => {
        const report = await runPreflightChecks(readyContext());
        assert.deepEqual(report.failures, []);
        assert.deepEqual(report.warnings, []);
        assert.equal(canSubmitFromReport(report), true);
    });

    it("reports each missing piece as its own failure", async () => {
        const report = await runPreflightChecks({
            job: { isInInitialStatus: true, workflow: { subworkflows: [] }, compute: null },
            materials: [],
        });
        assert.deepEqual(report.failures, ["inputs", "workflow", "compute", "saved"]);
        assert.equal(canSubmitFromReport(report), false);
    });

    it("sends every failure to the step that fixes it", async () => {
        const report = await runPreflightChecks({
            job: { isInInitialStatus: true, workflow: { subworkflows: [] }, compute: null },
            materials: [],
        });
        assert.deepEqual(
            report.rows.filter((row) => row.state === "fail").map((row) => row.fix?.stepId),
            ["material", "workflow", "compute", "review"],
        );
    });

    it("runs host-injected checks after the built-in ones", async () => {
        const balance: PreflightCheck = async () => ({
            id: "balance",
            label: "Balance",
            state: "fail",
            detail: "No payment method on file",
        });
        const report = await runPreflightChecks(readyContext(), [checkInputs, balance]);
        assert.deepEqual(
            report.rows.map((row) => row.id),
            ["inputs", "balance"],
        );
        assert.deepEqual(report.failures, ["balance"]);
    });

    it("does not let a broken check block submission", async () => {
        // Our own bug must not stand between the reader and their job; the row
        // says the check could not run rather than claiming a problem with it.
        const broken: PreflightCheck = async () => {
            throw new Error("DAO unreachable");
        };
        const report = await runPreflightChecks(readyContext(), [checkInputs, broken]);
        assert.deepEqual(report.failures, []);
        assert.equal(canSubmitFromReport(report), true);
        assert.equal(report.rows[1].state, "skip");
        assert.equal(report.rows[1].explanation, "DAO unreachable");
    });
});

describe("checkInputs", () => {
    it("names the material and its size", async () => {
        const row = await checkInputs({
            ...readyContext(),
            materials: [{ formula: "Si2", basis: { elements: [{}, {}] } }],
        });
        assert.equal(row?.state, "pass");
        assert.ok(row?.detail.startsWith("Si2"));
    });

    it("states the multiplier for a batch, because it is what surprises people", async () => {
        const row = await checkInputs({
            ...readyContext(),
            materials: [{ formula: "Si2" }, { formula: "Ge2" }, { formula: "GaN" }],
        });
        assert.equal(row?.detail, "3 materials — the workflow runs 3 times");
    });

    it("asks for a dataset, not a material, on a dataset job", async () => {
        const context = readyContext();
        const row = await checkInputs({
            ...context,
            job: { ...context.job, workflow: { subworkflows: [], isUsingDataset: false } },
            isUsingMaterials: false,
            materials: [],
        });
        assert.equal(row?.state, "fail");
        assert.equal(row?.fix?.stepId, "dataset");
    });
});

describe("checkWorkflowRenders", () => {
    it("fails with the template error when rendering throws", async () => {
        const context = readyContext();
        const row = await checkWorkflowRenders({
            ...context,
            job: {
                ...context.job,
                render: () => {
                    throw new Error("KPOINTS: undefined variable 'kgrid'");
                },
            },
        });
        assert.equal(row?.state, "fail");
        assert.equal(row?.explanation, "KPOINTS: undefined variable 'kgrid'");
        assert.equal(row?.fix?.stepId, "workflow");
    });

    it("skips rather than passes when the host's job cannot render", async () => {
        const context = readyContext();
        const row = await checkWorkflowRenders({
            ...context,
            job: { ...context.job, render: undefined },
        });
        assert.equal(row?.state, "skip");
    });
});

describe("checkComputeLimits", () => {
    it("fails on a walltime over the queue cap and says which cap", async () => {
        const context = readyContext();
        const row = await checkComputeLimits({
            ...context,
            job: { ...context.job, compute: { ...context.job.compute, timeLimit: "24:00:00" } },
        });
        assert.equal(row?.state, "fail");
        assert.match(row!.detail, /24 h exceeds the queue limit of 12 h/);
        assert.equal(row?.fix?.stepId, "compute");
    });

    it("fails on more nodes than the cluster allows", async () => {
        const context = readyContext();
        const row = await checkComputeLimits({
            ...context,
            job: { ...context.job, compute: { ...context.job.compute, nodes: 8 } },
        });
        assert.equal(row?.state, "fail");
        assert.match(row!.detail, /8 nodes exceeds the 4-node limit/);
    });

    it("admits it cannot judge when the host published no limits", async () => {
        const row = await checkComputeLimits({ ...readyContext(), clusterMetadata: [] });
        assert.equal(row?.state, "skip");
        assert.match(row!.detail, /no published limits/);
    });
});

describe("checkBudget", () => {
    it("says what is left after the run", async () => {
        const row = await checkBudget({
            ...readyContext(),
            quota: { remainingCoreHours: 500 },
        });
        assert.equal(row?.state, "pass");
        assert.match(row!.detail, /64 core·h ≈ \$5.12 — 436 core·h would remain/);
    });

    it("fails when the run does not fit in what is left", async () => {
        const row = await checkBudget({ ...readyContext(), quota: { remainingCoreHours: 32 } });
        assert.equal(row?.state, "fail");
        assert.equal(row?.fix?.stepId, "compute");
    });

    it("warns — the account holder's call — when the run eats most of the quota", async () => {
        const row = await checkBudget({ ...readyContext(), quota: { remainingCoreHours: 100 } });
        assert.equal(row?.state, "warn");
    });

    it("counts every material in a batch against the quota", async () => {
        const row = await checkBudget({
            ...readyContext(),
            materials: [{}, {}, {}],
            quota: { remainingCoreHours: 500 },
        });
        assert.match(row!.detail, /192 core·h/);
    });

    it("skips rather than passing when no quota was injected", async () => {
        const row = await checkBudget(readyContext());
        assert.equal(row?.state, "skip");
    });
});

describe("acknowledgement", () => {
    const warned = (): PreflightReport => ({
        rows: [],
        failures: [],
        warnings: ["budget"],
    });

    it("holds submission until every warning is acknowledged", () => {
        assert.equal(canSubmitFromReport(warned()), false);
        assert.equal(canSubmitFromReport(warned(), ["budget"]), true);
    });

    it("never lets an acknowledgement clear a failure", () => {
        const report: PreflightReport = { rows: [], failures: ["compute"], warnings: [] };
        assert.equal(canSubmitFromReport(report, ["compute"]), false);
    });

    it("counts problems before warnings in the header line", () => {
        assert.equal(getReportSummary(null), "Running checks…");
        assert.equal(
            getReportSummary({ rows: [], failures: ["a", "b"], warnings: ["c"] }),
            "2 problems to fix",
        );
        assert.equal(getReportSummary(warned()), "1 warning to acknowledge");
        assert.equal(getReportSummary(warned(), ["budget"]), "All checks passed");
    });
});
