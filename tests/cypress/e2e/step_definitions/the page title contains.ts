import { Then } from "@badeball/cypress-cucumber-preprocessor";

Then("the page title contains {string}", (title: string) => {
    cy.title().should("contain", title);
});
