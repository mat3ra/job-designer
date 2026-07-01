/* eslint-disable @typescript-eslint/no-floating-promises */
import assert from "node:assert";
import test from "node:test";

import { shouldPersistJobOnUpdate } from "../src/shouldPersistJobOnUpdate";

const baseProps = {
    materials: [],
    index: 0,
    materialsSet: undefined,
    metaProperties: [],
    job: { id: "job-1" },
};

test("skip persist when materialsSet replaced job in Redux (stale state.entity)", () => {
    const prevProps = { ...baseProps, materials: [], job: { id: "job-1", name: "base" } };
    const props = {
        ...baseProps,
        materials: [{ id: "m1" }, { id: "m2" }],
        job: { id: "job-1", name: "base {{ material.formula }}" },
    };

    assert.strictEqual(shouldPersistJobOnUpdate(prevProps, props), false);
});

test("persist when only material index changes and job reference is unchanged", () => {
    const job = { id: "job-1", name: "base {{ material.formula }}" };
    const prevProps = { ...baseProps, index: 0, job };
    const props = { ...baseProps, index: 1, job };

    assert.strictEqual(shouldPersistJobOnUpdate(prevProps, props), true);
});

test("persist when metaProperties refresh with the same job reference", () => {
    const job = { id: "job-1" };
    const prevProps = { ...baseProps, metaProperties: [], job };
    const props = { ...baseProps, metaProperties: [{ id: "mp1" }], job };

    assert.strictEqual(shouldPersistJobOnUpdate(prevProps, props), true);
});

test("skip persist when nothing relevant changed", () => {
    const props = { ...baseProps };

    assert.strictEqual(shouldPersistJobOnUpdate(props, props), false);
});
