import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
    getSubmitBlockedReason,
    getSubmitBlockers,
    isJobSubmittable,
    type SubmittableJob,
} from "../src/jobSubmission";

const readyJob: SubmittableJob = {
    id: "job-1",
    isInInitialStatus: true,
    workflow: { subworkflows: [{}] },
    compute: { cluster: { fqdn: "cluster-1.mat3ra.com" } },
};

describe("getSubmitBlockers", () => {
    it("finds nothing wrong with a ready job", () => {
        assert.deepEqual(getSubmitBlockers({ job: readyJob, materials: [{}] }), []);
    });

    it("asks for a material only when the job uses materials", () => {
        assert.deepEqual(getSubmitBlockers({ job: readyJob, materials: [] }), [
            "Select a material",
        ]);
        // Dataset-driven jobs take a dataset, not a material.
        assert.deepEqual(
            getSubmitBlockers({ job: readyJob, materials: [], isUsingMaterials: false }),
            [],
        );
    });

    it("asks for a workflow when there are no subworkflows", () => {
        const job = { ...readyJob, workflow: { subworkflows: [] } };
        assert.deepEqual(getSubmitBlockers({ job, materials: [{}] }), ["Select a workflow"]);
    });

    it("asks for compute when no cluster is chosen", () => {
        assert.deepEqual(
            getSubmitBlockers({ job: { ...readyJob, compute: null }, materials: [{}] }),
            ["Configure compute"],
        );
        assert.deepEqual(
            getSubmitBlockers({ job: { ...readyJob, compute: { cluster: {} } }, materials: [{}] }),
            ["Configure compute"],
        );
    });

    it("asks for a save when the job has never been persisted", () => {
        const { id, ...unsaved } = readyJob;
        assert.deepEqual(getSubmitBlockers({ job: unsaved, materials: [{}] }), ["Save the job"]);
    });

    it("orders blockers the way a reader would work through them", () => {
        assert.deepEqual(
            getSubmitBlockers({
                job: { isInInitialStatus: true, workflow: { subworkflows: [] }, compute: null },
                materials: [],
            }),
            ["Select a material", "Select a workflow", "Configure compute", "Save the job"],
        );
    });
});

describe("isJobSubmittable", () => {
    it("is true only for an unblocked job in its initial status", () => {
        assert.equal(isJobSubmittable({ job: readyJob, materials: [{}] }), true);
        assert.equal(isJobSubmittable({ job: readyJob, materials: [] }), false);
        assert.equal(
            isJobSubmittable({ job: { ...readyJob, isInInitialStatus: false }, materials: [{}] }),
            false,
        );
    });
});

describe("getSubmitBlockedReason", () => {
    it("is null when there is nothing to report", () => {
        assert.equal(getSubmitBlockedReason({ job: readyJob, materials: [{}] }), null);
    });

    it("names the single blocker", () => {
        assert.equal(getSubmitBlockedReason({ job: readyJob, materials: [] }), "Select a material");
    });

    it("names the first blocker and counts the rest", () => {
        assert.equal(
            getSubmitBlockedReason({
                job: { isInInitialStatus: true, workflow: { subworkflows: [] }, compute: null },
                materials: [],
            }),
            "Select a material (+3 more)",
        );
    });
});
