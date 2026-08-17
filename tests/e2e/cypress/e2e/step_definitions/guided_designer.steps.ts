import { And, Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";

/**
 * Steps for `guided_designer.feature`.
 *
 * Every selector here is an `id` the components set deliberately
 * (`#job-readiness-rail`, `#job-step-<id>`, `#job-preflight-row-<id>`) rather
 * than a class or a text match. Text is asserted separately, so a copy change —
 * or a translation, now that the strings go through `src/messages.ts` — fails
 * the assertion it should and not the lookup.
 */

/** The standalone demo mounts asynchronously; the rail is the first thing to settle. */
const RENDER_TIMEOUT = 30_000;

Given("I open the guided job designer", () => {
    cy.visit("/");
    cy.get("#job-readiness-rail", { timeout: RENDER_TIMEOUT }).should("exist");
});

// ─── Rail ─────────────────────────────────────────────────────────────────────

Then("the readiness rail is visible", () => {
    cy.get("#job-readiness-rail").should("be.visible");
});

Then("the readiness rail is absent", () => {
    cy.get("#job-readiness-rail").should("not.exist");
});

Then("the rail step {string} reads {string}", (stepId: string, text: string) => {
    cy.get(`#job-step-${stepId}`).should("contain.text", text);
});

Then("the rail step {string} is the current step", (stepId: string) => {
    cy.get(`#job-step-${stepId}`).should("have.attr", "aria-current", "step");
});

When("I open the rail step {string}", (stepId: string) => {
    cy.get(`#job-step-${stepId}`).click();
});

Then("the numbered tab strip is visible", () => {
    cy.get(".MuiTabs-root").should("be.visible");
});

// ─── Context strip ────────────────────────────────────────────────────────────

Then("the context strip is visible", () => {
    cy.get("#job-context-strip").should("be.visible");
});

Then("the context chip {string} is visible", (stepId: string) => {
    cy.get(`#job-context-${stepId}`).should("be.visible");
});

When("I click the context chip {string}", (stepId: string) => {
    cy.get(`#job-context-${stepId}`).click();
});

Then("the estimate chip reads {string}", (text: string) => {
    cy.get("#job-context-estimate").should("contain.text", text);
});

// ─── Submit ───────────────────────────────────────────────────────────────────

Then("the submit button is disabled", () => {
    cy.get("#job-submit-button").should("be.disabled");
});

Then("the submit button is enabled", () => {
    cy.get("#job-submit-button").should("not.be.disabled");
});

Then("the submit button is absent", () => {
    cy.get("#job-submit-button").should("not.exist");
});

Then("the submit button explains {string}", (reason: string) => {
    // The reason lives on the tooltip wrapper, since MUI needs a non-disabled
    // element for a tooltip on a disabled control to fire at all.
    cy.get("#job-submit-button").parent().should("have.attr", "aria-label", reason);
});

When("I click submit", () => {
    cy.get("#job-submit-button").click();
});

// ─── Compute ──────────────────────────────────────────────────────────────────

When(
    "I configure compute on {string} with {int} nodes and {int} cores for {string}",
    (cluster: string, nodes: number, cores: number, walltime: string) => {
        cy.get("#job-step-compute").click();
        cy.get("#root_cluster\\.fqdn").click();
        cy.get("li[role='option']").contains(cluster).click();

        // A queue belongs to a cluster, so it is chosen after one is.
        cy.get("#root_queue").click();
        cy.get("table tr").contains("OR").click();
        cy.get("body").type("{esc}");

        cy.get("#root_nodes").clear().type(String(nodes));
        cy.get("#root_ppn").clear().type(String(cores));
        cy.get("#root_timeLimit").clear().type(walltime).blur();
    },
);

// ─── Preflight ────────────────────────────────────────────────────────────────

Then("the preflight dialog is open", () => {
    cy.get("#job-preflight-dialog").should("be.visible");
});

Then("the preflight dialog is closed", () => {
    cy.get("#job-preflight-dialog").should("not.exist");
});

Then("the preflight summary reads {string}", (text: string) => {
    cy.get("#job-preflight-summary").should("contain.text", text);
});

Then("the preflight row {string} passed", (rowId: string) => {
    cy.get(`#job-preflight-row-${rowId}`).should("have.attr", "data-state", "pass");
});

Then("the preflight row {string} failed", (rowId: string) => {
    cy.get(`#job-preflight-row-${rowId}`).should("have.attr", "data-state", "fail");
});

Then("the preflight submit button is enabled", () => {
    cy.get("#job-preflight-submit").should("not.be.disabled");
});

Then("the preflight submit button is disabled", () => {
    cy.get("#job-preflight-submit").should("be.disabled");
});

When("I follow the preflight fix for {string}", (rowId: string) => {
    cy.get(`#job-preflight-fix-${rowId}`).click();
});

When("I acknowledge the preflight warning {string}", (rowId: string) => {
    cy.get(`#job-preflight-ack-${rowId}`).click();
});

// ─── Materials ────────────────────────────────────────────────────────────────

Then("the materials tray is visible", () => {
    cy.get("#job-materials-tray").should("be.visible");
});

Then("the batch note is visible", () => {
    cy.get("#job-materials-batch-note").should("be.visible");
});

// ─── Monitor ──────────────────────────────────────────────────────────────────

When("I switch the demo job to running", () => {
    cy.get("[data-tid='simulate-run-toggle']").click();
    // The demo remounts the designer, so wait for the rail to come back rather
    // than asserting against the tree that is being torn down.
    cy.get("#job-step-results", { timeout: RENDER_TIMEOUT }).should("exist");
});

Then("the run monitor is visible", () => {
    cy.get("#run-monitor", { timeout: RENDER_TIMEOUT }).should("be.visible");
});

Then("the run monitor lists the workflow's units", () => {
    cy.get("[id^='run-monitor-unit-']").should("have.length.greaterThan", 0);
});

// ─── Demo controls ────────────────────────────────────────────────────────────

When("I turn the guided layout off", () => {
    cy.contains("button", "Guided layout").click();
});

export { And };
