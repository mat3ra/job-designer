import Widget from "./Widget";

/**
 * The standalone demo's top bar (`src/standalone/index.tsx`): workflow + material selectors and
 * the Export JSON button. Changing either selector remounts the whole designer via
 * `key={designerKey}`, which is what makes these useful for exercising re-initialisation.
 *
 * The MUI `Select`s are given no `id`, so the trigger is matched by its `aria-labelledby`, which
 * MUI builds from the `InputLabel` id plus a generated one - hence the `*=` match.
 */
export default class StandaloneTopBarWidget extends Widget {
    static selectors = {
        workflowSelect: '[aria-labelledby*="workflow-select-label"]',
        materialSelect: '[aria-labelledby*="material-select-label"]',
        // The listbox is portaled to <body>, outside this widget's wrapper, so it is
        // deliberately NOT wrapped.
        option: 'ul[role="listbox"] li[role="option"]',
    };

    selectWorkflowByIndex(index: number) {
        this.selectOptionByIndex(StandaloneTopBarWidget.selectors.workflowSelect, index);
    }

    selectMaterialByIndex(index: number) {
        this.selectOptionByIndex(StandaloneTopBarWidget.selectors.materialSelect, index);
    }

    /**
     * tede's `Browser.select` only drives native `<select>` elements, and it has no MUI helper -
     * so open the popover and click the option, mirroring materials-designer's
     * `StandataDialogWidget`.
     */
    private selectOptionByIndex(triggerSelector: string, index: number) {
        this.browser.click(this.getWrappedSelector(triggerSelector));
        this.browser.waitForVisible(StandaloneTopBarWidget.selectors.option);
        this.browser.get(StandaloneTopBarWidget.selectors.option).eq(index).click();
        // The popover unmounts on select; wait for it so a following click isn't intercepted
        // by the closing backdrop.
        this.browser.waitForDisappear(StandaloneTopBarWidget.selectors.option);
    }
}
