import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeDialogHandle } from "../src/dialogHandles";

describe("normalizeDialogHandle", () => {
    it("opens a tuple handle, which is what the webapp passes", () => {
        const calls: string[] = [];
        const dialog = normalizeDialogHandle([() => calls.push("open"), () => calls.push("close")]);
        dialog.open();
        dialog.close();
        assert.deepEqual(calls, ["open", "close"]);
    });

    it("opens an object handle, which is what the container's type declares", () => {
        // Both shapes are real and present in this codebase; picking a winner
        // would break whichever host is on the other one.
        const calls: string[] = [];
        const dialog = normalizeDialogHandle({
            isOpen: false,
            open: () => calls.push("open"),
            close: () => calls.push("close"),
        });
        dialog.open();
        dialog.close();
        assert.deepEqual(calls, ["open", "close"]);
    });

    it("passes the dialog's configuration through", () => {
        const received: unknown[] = [];
        normalizeDialogHandle([
            (...args: unknown[]) => received.push(...args),
            () => undefined,
        ]).open({ title: "Select Materials" });
        assert.deepEqual(received, [{ title: "Select Materials" }]);
    });

    it("does nothing rather than throwing when the host wired no dialog", () => {
        // The rail puts these one click from the front page; an affordance that
        // throws is worse than one that quietly does nothing.
        assert.doesNotThrow(() => normalizeDialogHandle(undefined).open());
        assert.doesNotThrow(() => normalizeDialogHandle(null).close());
        assert.doesNotThrow(() => normalizeDialogHandle({} as never).open());
    });

    it("survives a half-built handle", () => {
        assert.doesNotThrow(() =>
            normalizeDialogHandle([undefined as never, undefined as never]).open(),
        );
        assert.doesNotThrow(() =>
            normalizeDialogHandle({ open: () => undefined } as never).close(),
        );
    });
});
