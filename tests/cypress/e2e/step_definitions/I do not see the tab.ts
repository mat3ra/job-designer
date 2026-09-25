import { Then } from "@badeball/cypress-cucumber-preprocessor";

import JobDesignerPage from "../../support/widgets/JobDesignerPage";
import type { TabName } from "../../support/widgets/JobDesignerWidget";

Then("I do not see the {string} tab", (tab: string) => {
    new JobDesignerPage().designerWidget.assertTabNotPresent(tab as TabName);
});
