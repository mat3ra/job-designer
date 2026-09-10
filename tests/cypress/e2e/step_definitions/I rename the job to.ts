import { When } from "@badeball/cypress-cucumber-preprocessor";

import JobDesignerPage from "../../support/widgets/JobDesignerPage";

When("I rename the job to {string}", (name: string) => {
    new JobDesignerPage().designerWidget.renameJob(name);
});
