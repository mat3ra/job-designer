import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getSaveState, getSaveStateLabel, shouldWarnBeforeLeaving } from "../src/saveState";

describe("getSaveState", () => {
    it("reports what is actually true of the entity", () => {
        assert.equal(getSaveState({ hasUnsavedChanges: false }), "saved");
        assert.equal(getSaveState({ hasUnsavedChanges: true }), "unsaved");
    });

    it("prefers the in-flight state over both", () => {
        // Mid-save the honest answer is neither "saved" nor "unsaved".
        assert.equal(getSaveState({ hasUnsavedChanges: true, isSaving: true }), "saving");
        assert.equal(getSaveState({ hasUnsavedChanges: false, isSaving: true }), "saving");
    });
});

describe("getSaveStateLabel", () => {
    it("never claims saved for a dirty job", () => {
        // The whole point: the mockups' "All changes saved" is only allowed to
        // appear when it is true.
        assert.equal(
            getSaveStateLabel(getSaveState({ hasUnsavedChanges: true })),
            "Unsaved changes",
        );
        assert.equal(
            getSaveStateLabel(getSaveState({ hasUnsavedChanges: false })),
            "All changes saved",
        );
    });
});

describe("shouldWarnBeforeLeaving", () => {
    it("warns when leaving would lose edits", () => {
        assert.equal(shouldWarnBeforeLeaving({ hasUnsavedChanges: true, editable: true }), true);
    });

    it("stays quiet when there is nothing to lose", () => {
        assert.equal(shouldWarnBeforeLeaving({ hasUnsavedChanges: false, editable: true }), false);
        // A shared or finished job cannot be edited, so nothing is at risk.
        assert.equal(shouldWarnBeforeLeaving({ hasUnsavedChanges: true, editable: false }), false);
    });

    it("stays quiet mid-save, which is already on its way to the server", () => {
        // Warning here trains people to dismiss the dialog without reading it.
        assert.equal(
            shouldWarnBeforeLeaving({ hasUnsavedChanges: true, editable: true, isSaving: true }),
            false,
        );
    });
});
