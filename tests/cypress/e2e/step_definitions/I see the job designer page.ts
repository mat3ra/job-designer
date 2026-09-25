import { Then } from "@badeball/cypress-cucumber-preprocessor";

import JobDesignerPage from "../../support/widgets/JobDesignerPage";

Then("I see the job designer page", () => {
    new JobDesignerPage().designerWidget.assertHeaderVisible();
});
