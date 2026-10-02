import { When } from "@badeball/cypress-cucumber-preprocessor";

import JobDesignerPage from "../../support/widgets/JobDesignerPage";

When("I click the save button", () => {
    new JobDesignerPage().designerWidget.clickSave();
});
