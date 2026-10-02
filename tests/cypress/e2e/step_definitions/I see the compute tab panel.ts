import { Then } from "@badeball/cypress-cucumber-preprocessor";

import JobDesignerPage from "../../support/widgets/JobDesignerPage";

Then("I see the compute tab panel", () => {
    new JobDesignerPage().designerWidget.assertTabPanelVisible("compute");
});
