import { Then } from "@badeball/cypress-cucumber-preprocessor";

import JobDesignerPage from "../../support/widgets/JobDesignerPage";

Then("I see the compute form", () => {
    new JobDesignerPage().designerWidget.assertComputeFormVisible();
});
