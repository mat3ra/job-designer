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

export type DialogTupleHandle = [(...args: unknown[]) => void, () => void];

export interface DialogObjectHandle {
    isOpen?: boolean;
    open: (...args: unknown[]) => void;
    close: () => void;
}

export type DialogHandle = DialogTupleHandle | DialogObjectHandle | undefined | null;

export interface NormalizedDialog {
    open: (...args: unknown[]) => void;
    close: () => void;
}

const noop = () => undefined;

/**
 * Always returns something callable. A missing dialog is a host that did not
 * wire one up — the affordance should do nothing rather than throw on click.
 */
export function normalizeDialogHandle(handle: DialogHandle): NormalizedDialog {
    if (Array.isArray(handle)) {
        const [open, close] = handle;

        return { open: open ?? noop, close: close ?? noop };
    }

    if (handle && typeof handle.open === "function") {
        return { open: handle.open, close: handle.close ?? noop };
    }

    return { open: noop, close: noop };
}
