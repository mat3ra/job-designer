import { Then } from "@badeball/cypress-cucumber-preprocessor";

import JobDesignerPage from "../../support/widgets/JobDesignerPage";

Then("the workflow tab panel is not mounted", () => {
    new JobDesignerPage().designerWidget.assertTabPanelNotMounted("workflow");
});
