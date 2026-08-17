/**
 * Whether the job on screen matches the one that was persisted.
 *
 * The designer saves manually, but says nothing about whether it needs to: a
 * job with unsaved edits looks exactly like a saved one, and closing the tab
 * loses them silently. The guided-designer mockups show getMessage("saveState.saved") in
 * the header — copy that would be worse than the current silence if it were not
 * actually true, so this tracks the real thing.
 *
 * Explicitly *not* autosave. Persisting automatically is a product decision
 * (UX-498) with its own backend implications; this only stops the interface
 * from being quiet about state it already knows.
 */
import { getMessage } from "./messages";
export function getSaveState({ hasUnsavedChanges, isSaving = false, }) {
    if (isSaving)
        return "saving";
    return hasUnsavedChanges ? "unsaved" : "saved";
}
const SAVE_STATE_LABELS = {
    saved: getMessage("saveState.saved"),
    unsaved: getMessage("saveState.unsaved"),
    saving: getMessage("saveState.saving"),
};
export function getSaveStateLabel(state) {
    return SAVE_STATE_LABELS[state];
}
/**
 * Whether leaving now would lose work.
 *
 * A read-only view has nothing to lose, and a job mid-save is already on its
 * way to the server — warning in either case trains people to dismiss the
 * dialog without reading it.
 */
export function shouldWarnBeforeLeaving({ hasUnsavedChanges, editable, isSaving = false, }) {
    return Boolean(editable) && hasUnsavedChanges && !isSaving;
}
