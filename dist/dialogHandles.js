/**
 * Opening a host-provided dialog, whichever shape the host gave it in.
 *
 * This package's own types disagree with its own code. `JobDesignerDialogState`
 * describes `{ isOpen, open, close }`, which is what the container declares and
 * what the standalone demo passes; `Job.jsx` destructures `[open, close]`, which
 * is what `useReduxDialog` returns and therefore what the webapp actually flows
 * through. Both shapes are real and present.
 *
 * Nothing caught it because the only route to these openers was the actions
 * dropdown, which no test or demo run ever clicked. The rail's "Change"
 * affordances put them one click from the front page, and the mismatch surfaced
 * immediately as `object is not iterable`.
 *
 * Normalising is the honest fix rather than picking a winner: a host on either
 * shape works, and neither has to be migrated before the rail ships.
 */
const noop = () => undefined;
/**
 * Always returns something callable. A missing dialog is a host that did not
 * wire one up — the affordance should do nothing rather than throw on click.
 */
export function normalizeDialogHandle(handle) {
    var _a;
    if (Array.isArray(handle)) {
        const [open, close] = handle;
        return { open: open !== null && open !== void 0 ? open : noop, close: close !== null && close !== void 0 ? close : noop };
    }
    if (handle && typeof handle.open === "function") {
        return { open: handle.open, close: (_a = handle.close) !== null && _a !== void 0 ? _a : noop };
    }
    return { open: noop, close: noop };
}
