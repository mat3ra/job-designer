import { When, Then, And } from "@badeball/cypress-cucumber-preprocessor";

When("I open the job designer app", () => {
    cy.visit("/");
});

Then("I see the job designer root element", () => {
    cy.get("#root").should("exist");
    cy.get("#root").should("not.be.empty");
});

Then("the page title contains {string}", (title: string) => {
    cy.title().should("contain", title);
});

Then("I see the job designer heading", () => {
    cy.get("#job-designer-app").should("exist");
    cy.get("h1").should("contain.text", "Job Designer");
});

// ─── Status Badges ────────────────────────────────────────────────────────────

Then("the status badges container exists", () => {
    cy.get("#status-badges-container").should("exist");
});

Then("the pre_submission status badge is visible", () => {
    cy.get("[data-status='pre_submission']").should("be.visible");
});

Then("the active status badge is visible", () => {
    cy.get("[data-status='active']").should("be.visible");
});

Then("the finished status badge is visible", () => {
    cy.get("[data-status='finished']").should("be.visible");
});

Then("the error status badge is visible", () => {
    cy.get("[data-status='error']").should("be.visible");
});

Then("the active status badge has the warning color class", () => {
    cy.get("[data-status='active']").should("have.class", "status-badge--warning");
});

Then("the finished status badge has the success color class", () => {
    cy.get("[data-status='finished']").should("have.class", "status-badge--success");
});

Then("the error status badge has the error color class", () => {
    cy.get("[data-status='error']").should("have.class", "status-badge--error");
});
