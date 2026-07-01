/* eslint-disable @typescript-eslint/no-floating-promises */
import assert from "node:assert";
import test from "node:test";

import { normalizeQueryMaterialIds } from "../src/containers/utils/normalizeQueryMaterialIds";

test("normalizeQueryMaterialIds returns undefined for empty input", () => {
    assert.strictEqual(normalizeQueryMaterialIds(undefined), undefined);
    assert.strictEqual(normalizeQueryMaterialIds(""), undefined);
    assert.strictEqual(normalizeQueryMaterialIds([]), undefined);
});

test("normalizeQueryMaterialIds parses a single id string", () => {
    assert.deepStrictEqual(normalizeQueryMaterialIds("mat-1"), ["mat-1"]);
});

test("normalizeQueryMaterialIds parses comma-separated ids", () => {
    assert.deepStrictEqual(normalizeQueryMaterialIds("mat-1, mat-2"), ["mat-1", "mat-2"]);
});

test("normalizeQueryMaterialIds preserves array ids", () => {
    assert.deepStrictEqual(normalizeQueryMaterialIds(["mat-1", "mat-2"]), ["mat-1", "mat-2"]);
});
