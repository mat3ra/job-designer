import { Then } from "@badeball/cypress-cucumber-preprocessor";

import JobDesignerPage from "../../support/widgets/JobDesignerPage";

Then("I do not see the {string} action", (actionId: string) => {
    new JobDesignerPage().designerWidget.assertActionNotPresent(actionId);
});
