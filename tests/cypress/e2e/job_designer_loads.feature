Feature: Job Designer standalone app loads and renders

    Scenario: The standalone app renders without a JS error
        When I open the job designer page
        Then I see the job designer page

    Scenario: The app title is correct
        When I open the job designer page
        Then the page title contains "Job Designer"

    # The standalone app injects `getRouteQueryTab: () => "workflow"`, which `resolveDefaultTab`
    # consults first for a job in an initial status.
    Scenario: The workflow tab is active on load
        When I open the job designer page
        Then I see the workflow tab panel

    # Guards `conditionalTabsMap` + `getConditionalTabs`: workflow and compute always render,
    # materials needs a material, and dataset/results/files must NOT appear for this
    # pre-submission job with a standata workflow.
    Scenario: Only the applicable tabs are rendered
        When I open the job designer page
        Then I see the "material" tab
        And I see the "workflow" tab
        And I see the "compute" tab
        And I do not see the "dataset" tab
        And I do not see the "results" tab
        And I do not see the "files" tab

    # Regression coverage for a crash where job-designer's own reducers/components read
    # `job.workflow.*` expecting a live workflow instance (updateMethodData, isMultiMaterial,
    # usedApplications, subworkflows) - jode's `Job` class exposes that as `.workflowInstance`
    # instead, `.workflow` being just the raw JSON schema field. The bug threw synchronously
    # while building the job designer's state, so it failed before any of the app - not
    # just the Workflow tab - ever rendered.
    Scenario: The workflow tab renders real workflow content without a JS error
        When I open the job designer page
        And I switch to the workflow tab
        Then I see the workflow tab panel

    # Only the active tab's panel is mounted, so the previous one must be gone entirely.
    Scenario: Switching to the materials tab unmounts the workflow panel
        When I open the job designer page
        And I switch to the material tab
        Then I see the material tab panel
        And the workflow tab panel is not mounted

    # Exercises ComputeTab's conversion plus the whole @mat3ra/ive TypeScript rewrite, including
    # the `job.usedApplicationNames` fix - it previously read `job.workflow.usedApplicationNames`,
    # which resolves to the raw schema field and would throw.
    Scenario: The compute tab renders its form
        When I open the job designer page
        And I switch to the compute tab
        Then I see the compute tab panel
        And I see the compute form
        And I see the notifications panel

    Scenario: Switching between material and workflow tabs does not throw
        When I open the job designer page
        And I switch to the workflow tab
        And I switch to the material tab
        And I switch to the workflow tab
        Then I see the workflow tab panel

    Scenario: Cycling through every tab keeps the right panel mounted
        When I open the job designer page
        And I switch to the material tab
        Then I see the material tab panel
        When I switch to the compute tab
        Then I see the compute tab panel
        When I switch to the workflow tab
        Then I see the workflow tab panel

    # NOTE: a regression guard for the rename -> persist -> re-render path (no crash, no revert,
    # no render loop). It does NOT prove the in-place-mutation revision bump on its own: the job
    # is mutated in place and cove's EntityName holds local state synced from `value`, so the
    # name reads correct even if the re-render never happened.
    Scenario: Renaming the job keeps the new name across a tab round-trip
        When I open the job designer page
        And I rename the job to "Renamed Test Job"
        And I switch to the material tab
        And I switch to the workflow tab
        Then the job name is "Renamed Test Job"

    Scenario: Saving after a rename does not crash and keeps the new name
        When I open the job designer page
        And I rename the job to "Saved Test Job"
        And I click the save button
        Then I see the job designer page
        And the job name is "Saved Test Job"

    # Exercises getDefaultActions' `isShown` filtering: a freshly built `new Job()` has no id, so
    # Submit and Terminate must be absent while the selection actions are present.
    Scenario: The actions dropdown lists only the applicable actions
        When I open the job designer page
        And I open the actions dropdown
        Then I see the "select-material" action
        And I see the "select-workflow" action
        And I see the "select-parent-job" action
        And I do not see the "select-submit" action
        And I do not see the "select-terminate" action

    # Changing either top-bar selector remounts the designer via `key={designerKey}`, which
    # re-runs `initialJobDesignerState` against a different workflow/material.
    Scenario: Choosing a different workflow re-initialises the designer
        When I open the job designer page
        And I select workflow number 2
        Then I see the job designer page
        And I see the workflow tab panel

    Scenario: Choosing a different material re-initialises the designer
        When I open the job designer page
        And I select material number 2
        Then I see the job designer page
        And I see the workflow tab panel

    Scenario: Tabs still work after re-initialising with a different workflow
        When I open the job designer page
        And I select workflow number 2
        And I switch to the compute tab
        Then I see the compute tab panel
        And I see the compute form
