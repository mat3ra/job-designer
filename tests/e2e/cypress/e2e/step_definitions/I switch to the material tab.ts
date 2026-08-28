import { When } from "@badeball/cypress-cucumber-preprocessor";

import JobDesignerPage from "../../support/widgets/JobDesignerPage";

When("I switch to the material tab", () => {
    new JobDesignerPage().designerWidget.switchToTab("material");
});
