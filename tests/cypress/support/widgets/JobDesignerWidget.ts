import Widget from "./Widget";

// Matches jode's `TAB_NAVIGATION_CONFIG` itemName/id pairs (see `@mat3ra/jode/src/js/enums.ts`).
// TabsMenu (cove) renders each tab with `data-tab-name={itemName}`, and each tab panel's own
// root div gets `id={TAB_NAVIGATION_CONFIG[key].id}` - both forwarded straight to real DOM nodes.
const TAB_ITEM_NAMES = {
    material: "1. Materials",
    workflow: "2. Workflow",
    compute: "3. Compute",
    dataset: "1. Dataset",
    results: "4. Results",
    files: "5. Files",
} as const;

export type TabName = keyof typeof TAB_ITEM_NAMES;

/**
 * Wraps the job designer rendered by `@mat3ra/job-designer`'s `<JobLocalReduxContainer>`
 * (EntityHeader + TabsMenu + the active tab's panel) inside the standalone demo app.
 */
export default class JobDesignerWidget extends Widget {
    switchToTab(tab: TabName) {
        this.browser.click(this.getWrappedSelector(`[data-tab-name="${TAB_ITEM_NAMES[tab]}"]`));
    }

    assertHeaderVisible() {
        this.browser.assertVisibleWithRetry(this.getWrappedSelector("#job-designer-header"));
    }

    assertTabVisible(tab: TabName) {
        this.browser.assertVisibleWithRetry(
            this.getWrappedSelector(`[data-tab-name="${TAB_ITEM_NAMES[tab]}"]`),
        );
    }

    assertTabNotPresent(tab: TabName) {
        this.browser.assertNotExistWithRetry(
            this.getWrappedSelector(`[data-tab-name="${TAB_ITEM_NAMES[tab]}"]`),
        );
    }

    assertTabPanelVisible(tab: TabName) {
        this.browser.assertVisibleWithRetry(this.getWrappedSelector(`#${tab}[role="tabpanel"]`));
    }

    /**
     * Only the ACTIVE tab's panel is mounted (`Job.tsx` renders each panel behind an
     * `isCurrentTab*` guard), so an inactive panel is genuinely absent from the DOM rather than
     * merely hidden - this is a real assertion, not a visibility check.
     */
    assertTabPanelNotMounted(tab: TabName) {
        this.browser.assertNotExistWithRetry(this.getWrappedSelector(`#${tab}[role="tabpanel"]`));
    }

    // ─── Header ───────────────────────────────────────────────────────────────────────

    /**
     * cove's `EntityName` renders an always-on `InputBase` when the job is editable. `onChange`
     * is debounced 700ms while `onBlur` commits immediately, so blur rather than waiting.
     */
    renameJob(name: string) {
        // Chain the blur off setInputValue's own chainable: `.type()` leaves the input focused,
        // and Cypress's `.blur()` requires its subject to BE the focused element.
        this.browser
            .setInputValue(this.getWrappedSelector("#job-designer-header input.name"), name)
            .blur();
    }

    assertJobName(name: string) {
        this.browser.assertInputValueWithRetry(
            this.getWrappedSelector("#job-designer-header input.name"),
            name,
        );
    }

    /**
     * Targets the id directly: `ButtonMultiSelect` renders a `keepMounted` `Menu`, so a hidden
     * duplicate "Save" MenuItem is always in the DOM and a text-based click would be ambiguous.
     */
    clickSave() {
        this.browser.click(this.getWrappedSelector("button#save-button"));
    }

    openActionsDropdown() {
        this.browser.click(this.getWrappedSelector(".action-dropdown button"));
    }

    // The dropdown menu is a Popper portaled to <body>, so these are NOT wrapped by the
    // widget's own selector - same pattern materials-designer uses for its Standata dialog.
    assertActionShown(actionId: string) {
        this.browser.assertVisibleWithRetry(`li#${actionId}`);
    }

    assertActionNotPresent(actionId: string) {
        this.browser.assertNotExistWithRetry(`li#${actionId}`);
    }

    // ─── Compute tab ──────────────────────────────────────────────────────────────────

    assertComputeFormVisible() {
        this.browser.assertVisibleWithRetry(this.getWrappedSelector("#compute-step-form"));
    }

    /** Notify panel from `@mat3ra/ive`'s ComputeForm; renders even with no account users. */
    assertNotifyPanelVisible() {
        this.browser.assertExistWithRetry(this.getWrappedSelector("#users-multiselect"));
    }
}
