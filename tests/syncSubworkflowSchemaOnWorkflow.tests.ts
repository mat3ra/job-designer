/* eslint-disable @typescript-eslint/no-floating-promises */
import assert from "node:assert";
import test from "node:test";

import { syncSubworkflowSchemaOnWorkflow } from "../src/syncSubworkflowSchemaOnWorkflow";

test("syncSubworkflowSchemaOnWorkflow returns false when schema _id is unknown", () => {
    const workflow = {
        subworkflowInstances: [{ id: "sw-1" }],
        subworkflows: [{ _id: "sw-1" }],
    };

    assert.strictEqual(
        syncSubworkflowSchemaOnWorkflow(workflow as never, { _id: "missing" } as never),
        false,
    );
    assert.deepStrictEqual(workflow.subworkflows, [{ _id: "sw-1" }]);
});
