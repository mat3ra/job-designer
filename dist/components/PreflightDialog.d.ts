import React from "react";
import { type PreflightContext } from "../preflight";
export interface PreflightDialogProps {
    open: boolean;
    onClose: () => void;
    /**
     * What to check, read at the moment the checks run. A getter rather than the
     * context itself: the job is mutated in place, so a value captured at render
     * time would have the checks judging a stale copy, and a fresh object each
     * render would restart them — losing the reader's acknowledgements — every
     * time anything else on the page changed.
     */
    getContext: () => PreflightContext;
    /** Called once the report allows it — the designer's existing submit path. */
    onSubmit: () => void;
    /** Sends the reader to the step that fixes a row, closing the dialog. */
    onGoToStep: (stepId: string) => void;
}
/**
 * The last look before a job is submitted.
 *
 * Today Submit fires immediately, and anything the job got wrong — a walltime
 * over the queue cap, a template that will not render, a batch that quietly
 * costs eight times what the reader expected — surfaces minutes later as a
 * failed run. The checks that can be made cheaply are made here instead, while
 * the reader is still in a position to change something.
 *
 * Three outcomes, and they mean different things: a `fail` blocks and offers the
 * step that fixes it; a `warn` is the reader's call and needs acknowledging; a
 * `skip` is this designer admitting it has no data to judge by, which is not the
 * same as approval.
 */
export default function PreflightDialog({ open, onClose, getContext, onSubmit, onGoToStep, }: PreflightDialogProps): React.JSX.Element;
//# sourceMappingURL=PreflightDialog.d.ts.map