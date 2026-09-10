/* eslint-disable @typescript-eslint/no-floating-promises */
import { ComputableEntityMixin } from "@mat3ra/ive";
import { Job as JodeJob } from "@mat3ra/jode";
import { Workflow } from "@mat3ra/wode";
import assert from "node:assert";
import test from "node:test";
import React from "react";

/**
 * Regression test for a crash caught live in production: opening a job in web-app threw
 * "Cannot read properties of undefined (reading 'filter')" in `Job.renderWarnings`
 * (mixed in via `@mat3ra/ive`'s `ComputableEntityMixin`), because nothing in the real
 * entity stack (`@mat3ra/ide`, jode's `Job`, web-app's `CoreJob`) implements `.warnings`
 * any more. Fixed in `@mat3ra/ive` (defensive default + typed as optional).
 *
 * This exercises the real, installed `@mat3ra/ive` dependency against a real jode `Job`
 * entity, reproducing `Job.jsx`'s own `computedEntity` pattern (`get computedEntity() {
 * return this.state.entity; }`) - but does NOT import `../src/components/Job` itself:
 * that file transitively pulls in `@mat3ra/jove`'s `ResultsTab` -> `@mat3ra/prove`'s
 * Highcharts setup, which throws ("TypeError: n is not a function" in
 * highcharts-more/more.js) when merely imported outside a real browser/DOM environment -
 * a pre-existing constraint on this bare `node:test` runner (no jsdom configured), the
 * same reason `createJobDesignerReducer.tests.ts` imports from `../src/reducers` rather
 * than `Job.jsx` directly. See `@mat3ra/ive`'s own `ComputableEntityMixin.tests.ts` for
 * the mixin covered in isolation.
 */
class TestJobComponent extends ComputableEntityMixin(React.Component) {
    get computedEntity() {
        return this.state.entity;
    }
}

test("Job's computedEntity pattern does not throw renderWarnings for a real job with no .warnings", () => {
    const workflow = new Workflow(Workflow.defaultConfig);
    const job = new JodeJob({ name: "Test Job", status: "pre-submission" });
    job.setWorkflow(workflow);

    assert.strictEqual(
        "warnings" in job,
        false,
        "sanity check: jode's Job should not implement .warnings",
    );

    const instance = new TestJobComponent({});
    instance.state = { entity: job, dismissWarningAlerts: {}, dismissErrorAlerts: {} };

    assert.doesNotThrow(() => instance.renderWarnings());
});
