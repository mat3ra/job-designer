import { When } from "@badeball/cypress-cucumber-preprocessor";

import JobDesignerPage from "../../support/widgets/JobDesignerPage";

// 1-based in the feature text; the widget takes a 0-based index.
When("I select workflow number {int}", (position: number) => {
    new JobDesignerPage().topBar.selectWorkflowByIndex(position - 1);
});
