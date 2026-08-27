import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getBatchDescription, getMaterialSummary } from "../src/materialSummary";

const siliconLike = {
    name: "Si, Silicon, FCC (Fd-3m) 3D (Bulk), mp-149",
    formula: "Si",
    unitCellFormula: "Si2",
    lattice: { type: "FCC", a: 3.866976, b: 3.866975, c: 3.866975, alpha: 60, beta: 60, gamma: 60 },
    Basis: { elements: [{ id: 0 }, { id: 1 }] },
    external: {
        id: "mp-149",
        source: "MaterialsProject",
        url: "https://next-gen.materialsproject.org/materials/mp-149",
    },
};

describe("getMaterialSummary", () => {
    it("prefers the unit-cell formula over the reduced one", () => {
        // "Si" tells you less than "Si2" when deciding what will run.
        assert.equal(getMaterialSummary(siliconLike).formula, "Si2");
        assert.equal(getMaterialSummary({ formula: "GaN" }).formula, "GaN");
    });

    it("collapses equal lattice constants to a single value", () => {
        assert.equal(getMaterialSummary(siliconLike).latticeParameters, "a = 3.867 Å");
    });

    it("lists constants separately when the cell is not cubic", () => {
        const summary = getMaterialSummary({
            lattice: { type: "HEX", a: 3.19, b: 3.19, c: 5.189, alpha: 90, beta: 90, gamma: 120 },
        });
        assert.equal(summary.latticeParameters, "a 3.19 · b 3.19 · c 5.189 Å");
    });

    it("shows angles only when they are not all right angles", () => {
        assert.equal(getMaterialSummary(siliconLike).latticeAngles, "60° · 60° · 60°");
        const cubic = getMaterialSummary({
            lattice: { type: "CUB", a: 5, b: 5, c: 5, alpha: 90, beta: 90, gamma: 90 },
        });
        assert.equal(cubic.latticeAngles, undefined);
    });

    it("reads atom count from either basis spelling", () => {
        assert.equal(getMaterialSummary(siliconLike).atomCount, 2);
        assert.equal(getMaterialSummary({ basis: { elements: [1, 2, 3] } }).atomCount, 3);
    });

    it("carries the source through with its link", () => {
        const { source } = getMaterialSummary(siliconLike);
        assert.equal(source?.id, "mp-149");
        assert.equal(source?.name, "MaterialsProject");
        assert.ok(source?.url?.includes("mp-149"));
    });

    it("finds a space group only when the model carries one", () => {
        assert.equal(getMaterialSummary(siliconLike).spaceGroup, undefined);
        const withSymmetry = getMaterialSummary({
            derivedProperties: [{ name: "symmetry", spaceGroupSymbol: "Fd-3m" }],
        });
        assert.equal(withSymmetry.spaceGroup, "Fd-3m");
    });

    it("omits fields rather than throwing on partial or hostile input", () => {
        // The tab renders a fallback for hosts that pass a plain config, and model
        // getters can throw on incomplete data — a metadata panel must not take the
        // page down with it.
        assert.deepEqual(getMaterialSummary(undefined), {
            name: undefined,
            formula: undefined,
            latticeType: undefined,
            latticeParameters: undefined,
            latticeAngles: undefined,
            atomCount: undefined,
            spaceGroup: undefined,
            source: undefined,
        });

        const throwing = {
            get lattice() {
                throw new Error("no lattice on this config");
            },
            get name() {
                throw new Error("nope");
            },
        };
        assert.doesNotThrow(() => getMaterialSummary(throwing));
        assert.equal(getMaterialSummary(throwing).latticeParameters, undefined);
    });
});

describe("getBatchDescription", () => {
    it("states the consequence a materials set otherwise leaves implied", () => {
        assert.equal(
            getBatchDescription(3),
            "3 materials — the workflow runs 3 times, once per material.",
        );
    });

    it("does not imply a batch for a single material", () => {
        assert.equal(getBatchDescription(1), "The workflow runs once.");
        assert.equal(getBatchDescription(0), "The workflow runs once.");
    });
});
