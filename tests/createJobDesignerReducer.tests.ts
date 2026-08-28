/* eslint-disable @typescript-eslint/no-floating-promises */
import { Job } from "@mat3ra/jode";
import { Workflow } from "@mat3ra/wode";
import assert from "node:assert";
import test from "node:test";

import { createJobDesignerReducer } from "../src/reducers";

/**
 * Regression test for a crash caught live: job-designer's own reducer/component code read
 * `job.workflow.updateMethodData(...)` etc., inherited from the pre-jode webapp Job model where
 * `.workflow` *was* the live workflow instance. jode's `Job` class instead exposes `.workflow` as
 * the raw JSON schema field, with the live instance on `.workflowInstance` - calling
 * `.updateMethodData` straight off `job.workflow` threw `_a.updateMethodData is not a function`
 * as soon as `JobLocalReduxContainer` mounted with a real job.
 */
test("createJobDesignerReducer builds initial state from a real Job + Workflow without throwing", () => {
    const workflow = new Workflow(Workflow.defaultConfig);
    const job = new Job({ name: "Test Job", status: "pre-submission" });
    job.setWorkflow(workflow);

    let reducer;
    assert.doesNotThrow(() => {
        reducer = createJobDesignerReducer(job, [], []);
    });

    const state = reducer(undefined, { type: "@@INIT" });

    assert.strictEqual(state.job, job);
    assert.strictEqual(state.isMultiMaterial, workflow.isMultiMaterial);
});
