import Widget from "./Widget";

// Matches jode's `TAB_NAVIGATION_CONFIG` itemName/id pairs (see `@mat3ra/jode/src/js/enums.ts`).
// TabsMenu (cove) renders each tab with `data-tab-name={itemName}`, and each tab panel's own
// root div gets `id={TAB_NAVIGATION_CONFIG[key].id}` - both forwarded straight to real DOM nodes.
const TAB_ITEM_NAMES = {
    material: "1. Materials",
    workflow: "2. Workflow",
} as const;

type TabName = keyof typeof TAB_ITEM_NAMES;

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

    assertTabPanelVisible(tab: TabName) {
        this.browser.assertVisibleWithRetry(this.getWrappedSelector(`#${tab}[role="tabpanel"]`));
    }
}
