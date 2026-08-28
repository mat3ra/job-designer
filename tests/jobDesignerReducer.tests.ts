/* eslint-disable @typescript-eslint/no-floating-promises */
import JSONSchemasInterface from "@mat3ra/esse/dist/js/esse/JSONSchemasInterface";
import esseSchemas from "@mat3ra/esse/dist/js/schemas.json";
import { Job } from "@mat3ra/jode";
import { ApplicationRegistry } from "@mat3ra/standata";
import StandataDriver from "@mat3ra/standata/dist/js/StandataDriver";
import { Workflow } from "@mat3ra/wode";
import assert from "node:assert";
import test from "node:test";

import { initialJobDesignerState, jobDesignerReducer } from "../src/state/jobDesignerReducer";

// The material actions clone the job, which runs schema validation. Register the schemas the
// same way `src/standalone/preloads.ts` does (minus its browser-only bits), so these tests
// exercise the real jode/wode entities rather than stubs.
JSONSchemasInterface.setSchemas(esseSchemas as any);
ApplicationRegistry.setDriver(new StandataDriver());

/**
 * Replaces `createJobDesignerReducer.tests.ts`. job-designer no longer has a Redux store - the
 * same state now lives in `useJobDesignerState`'s `useReducer` - but the reducer itself is
 * exported standalone precisely so it can still be tested without mounting a component (the bare
 * `node:test` runner has no DOM, and importing the Job component pulls in Highcharts, which
 * throws outside a browser).
 *
 * The first test carries over the original regression guard for the `job.workflow` vs
 * `job.workflowInstance` crash.
 */

function makeJob() {
    const workflow = new Workflow(Workflow.defaultConfig);
    const job = new Job({ name: "Test Job", status: "pre-submission" });
    job.setWorkflow(workflow);
    return { job, workflow };
}

test("initial state builds from a real Job + Workflow without throwing", () => {
    const { job, workflow } = makeJob();

    let state;
    assert.doesNotThrow(() => {
        state = initialJobDesignerState(job, [], []);
    });

    assert.strictEqual(state.job, job);
    assert.strictEqual(state.isMultiMaterial, workflow.isMultiMaterial);
    assert.strictEqual(state.index, 0);
    assert.deepStrictEqual(state.workflowContexts, []);
    assert.strictEqual(state.renderGeneration, 0);
});

test("unknown actions return the identical state object", () => {
    const { job } = makeJob();
    const state = initialJobDesignerState(job, [], []);
    assert.strictEqual(jobDesignerReducer(state, { type: "@@INIT" } as any), state);
});

test("MATERIALS_UPDATE_INDEX sets the index immutably", () => {
    const { job } = makeJob();
    const state = initialJobDesignerState(job, [], []);

    const next = jobDesignerReducer(state, { type: "MATERIALS_UPDATE_INDEX", index: 2 });

    assert.strictEqual(next.index, 2);
    assert.notStrictEqual(next, state, "must return a new object, not mutate in place");
    assert.strictEqual(state.index, 0, "previous state must be untouched");
});

/**
 * `MATERIALS_REMOVE` is the most intricate path: it splices both `materials` and
 * `workflowContexts` with an ascending-index/position compensation, then clamps the active index.
 * It previously spliced `state.workflowContexts` IN PLACE, which is invisible to `useReducer`.
 */
test("MATERIALS_REMOVE drops the right entries and keeps contexts aligned", () => {
    const { job } = makeJob();
    const materials = ["a", "b", "c", "d"] as any[];
    const state = {
        ...initialJobDesignerState(job, [], []),
        materials,
        workflowContexts: [{ n: 0 }, { n: 1 }, { n: 2 }, { n: 3 }],
        index: 3,
    };

    const next = jobDesignerReducer(state, { type: "MATERIALS_REMOVE", indices: [0, 2] });

    assert.deepStrictEqual(next.materials, ["b", "d"]);
    assert.deepStrictEqual(
        next.workflowContexts,
        [{ n: 1 }, { n: 3 }],
        "contexts must be spliced at the same positions as materials",
    );
    assert.strictEqual(next.index, 1, "index clamps to the last valid material");

    // The previous state must be untouched — the old implementation spliced these in place.
    assert.deepStrictEqual(state.materials, ["a", "b", "c", "d"]);
    assert.deepStrictEqual(state.workflowContexts, [{ n: 0 }, { n: 1 }, { n: 2 }, { n: 3 }]);
    assert.strictEqual(state.index, 3);
});

test("MATERIALS_REMOVE is a no-op at one material", () => {
    const { job } = makeJob();
    const state = { ...initialJobDesignerState(job, [], []), materials: ["only"] as any[] };
    assert.strictEqual(jobDesignerReducer(state, { type: "MATERIALS_REMOVE" }), state);
});

test("MATERIALS_ADD appends a cloned context per new material without mutating state", () => {
    const { job } = makeJob();
    const state = {
        ...initialJobDesignerState(job, [], []),
        materials: ["a"] as any[],
        workflowContexts: [{ tag: "ctx" }],
        index: 0,
    };

    const next = jobDesignerReducer(state, {
        type: "MATERIALS_ADD",
        materials: ["b", "c"] as any[],
    });

    assert.deepStrictEqual(next.materials, ["a", "b", "c"]);
    assert.strictEqual(next.workflowContexts.length, 3);
    assert.deepStrictEqual(next.workflowContexts[1], { tag: "ctx" }, "new contexts clone current");
    assert.notStrictEqual(
        next.workflowContexts[1],
        state.workflowContexts[0],
        "cloned, not shared by reference",
    );
    assert.strictEqual(next.index, 0, "adding keeps the active index");
    assert.strictEqual(state.workflowContexts.length, 1, "previous state must be untouched");
});

test("MATERIALS_SET resets contexts to one clone per material and returns to index 0", () => {
    const { job } = makeJob();
    const state = {
        ...initialJobDesignerState(job, [], []),
        materials: ["a", "b"] as any[],
        workflowContexts: [{ n: 0 }, { n: 1 }],
        index: 1,
    };

    const next = jobDesignerReducer(state, {
        type: "MATERIALS_SET",
        materials: ["x", "y", "z"] as any[],
    });

    assert.deepStrictEqual(next.materials, ["x", "y", "z"]);
    assert.strictEqual(next.workflowContexts.length, 3);
    next.workflowContexts.forEach((ctx) =>
        assert.deepStrictEqual(ctx, { n: 1 }, "every context clones the previously active one"),
    );
    assert.strictEqual(next.index, 0);
    assert.strictEqual(state.index, 1, "previous state must be untouched");
});
