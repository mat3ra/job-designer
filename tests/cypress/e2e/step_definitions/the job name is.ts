import { Then } from "@badeball/cypress-cucumber-preprocessor";

import JobDesignerPage from "../../support/widgets/JobDesignerPage";

Then("the job name is {string}", (name: string) => {
    new JobDesignerPage().designerWidget.assertJobName(name);
});
