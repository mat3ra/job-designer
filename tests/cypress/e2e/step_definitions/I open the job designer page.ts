import { When } from "@badeball/cypress-cucumber-preprocessor";

import JobDesignerPage from "../../support/widgets/JobDesignerPage";

When("I open the job designer page", () => {
    new JobDesignerPage().open();
});
