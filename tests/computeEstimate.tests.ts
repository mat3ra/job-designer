import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
    estimateComputeUsage,
    findClusterMetadata,
    formatCost,
    formatEstimate,
    parseWalltimeHours,
} from "../src/computeEstimate";

const cluster = {
    fqdn: "cluster-007.mat3ra.com",
    pricePerCoreHour: 0.08,
    currency: "USD",
};

const compute = {
    cluster: { fqdn: cluster.fqdn },
    nodes: 1,
    ppn: 16,
    timeLimit: "04:00:00",
};

describe("parseWalltimeHours", () => {
    it("reads the HH:MM:SS the compute form produces", () => {
        assert.equal(parseWalltimeHours("04:00:00"), 4);
        assert.equal(parseWalltimeHours("00:30:00"), 0.5);
    });

    it("reads the D-HH:MM:SS form used for multi-day walltimes", () => {
        assert.equal(parseWalltimeHours("2-12:00:00"), 60);
    });

    it("accepts a bare number of hours", () => {
        assert.equal(parseWalltimeHours(12), 12);
    });

    it("returns undefined rather than zero for what it cannot read", () => {
        // Zero would be indistinguishable from a free job, and the estimate would
        // silently claim the run costs nothing.
        assert.equal(parseWalltimeHours(undefined), undefined);
        assert.equal(parseWalltimeHours(""), undefined);
        assert.equal(parseWalltimeHours("later"), undefined);
    });
});

describe("estimateComputeUsage", () => {
    it("multiplies nodes, cores and walltime into core-hours", () => {
        const estimate = estimateComputeUsage(compute, [cluster]);
        assert.equal(estimate.coreHours, 64);
    });

    it("prices the run when the host published a rate", () => {
        const estimate = estimateComputeUsage(compute, [cluster]);
        assert.equal(estimate.cost, 64 * 0.08);
        assert.equal(estimate.currency, "USD");
    });

    it("omits cost entirely when no pricing was injected", () => {
        // Most deployments have none; a zero here would read as "free".
        const estimate = estimateComputeUsage(compute, []);
        assert.equal(estimate.coreHours, 64);
        assert.equal(estimate.cost, undefined);
    });

    it("multiplies by the number of runs for a batch", () => {
        const estimate = estimateComputeUsage(compute, [cluster], 3);
        assert.equal(estimate.coreHours, 192);
    });

    it("gives no core-hours while the configuration is incomplete", () => {
        assert.equal(
            estimateComputeUsage({ ...compute, ppn: undefined }, [cluster]).coreHours,
            undefined,
        );
        assert.equal(estimateComputeUsage(null, [cluster]).coreHours, undefined);
    });

    it("ignores metadata belonging to a different cluster", () => {
        const other = { ...cluster, fqdn: "cluster-008.mat3ra.com" };
        assert.equal(estimateComputeUsage(compute, [other]).cost, undefined);
        assert.equal(findClusterMetadata(compute, [other, cluster])?.fqdn, cluster.fqdn);
    });
});

describe("formatting", () => {
    it("states core-hours alone when there is no price", () => {
        assert.equal(formatEstimate(estimateComputeUsage(compute, [])), "64 core·h");
    });

    it("states core-hours and cost together when there is one", () => {
        assert.equal(formatEstimate(estimateComputeUsage(compute, [cluster])), "64 core·h ≈ $5.12");
    });

    it("says nothing at all when nothing is known", () => {
        assert.equal(formatEstimate(estimateComputeUsage(null, [])), undefined);
    });

    it("survives a currency code Intl does not know", () => {
        assert.equal(formatCost(5.12, "NOTACURRENCY"), "5.12 NOTACURRENCY");
    });
});
