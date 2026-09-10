import { When } from "@badeball/cypress-cucumber-preprocessor";

import JobDesignerPage from "../../support/widgets/JobDesignerPage";

When("I open the actions dropdown", () => {
    new JobDesignerPage().designerWidget.openActionsDropdown();
});
