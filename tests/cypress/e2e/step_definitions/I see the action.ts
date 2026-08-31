import { Then } from "@badeball/cypress-cucumber-preprocessor";

import JobDesignerPage from "../../support/widgets/JobDesignerPage";

Then("I see the {string} action", (actionId: string) => {
    new JobDesignerPage().designerWidget.assertActionShown(actionId);
});
