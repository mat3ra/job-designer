Feature: Job Designer standalone app loads and renders

    Scenario: The standalone app renders without a JS error
        When I open the job designer page
        Then I see the job designer page

    Scenario: The app title is correct
        When I open the job designer page
        Then the page title contains "Job Designer"

    # Regression coverage for a crash where job-designer's own reducers/components read
    # `job.workflow.*` expecting a live workflow instance (updateMethodData, isMultiMaterial,
    # usedApplications, subworkflows) - jode's `Job` class exposes that as `.workflowInstance`
    # instead, `.workflow` being just the raw JSON schema field. The bug threw synchronously
    # while building the job designer's Redux store, so it failed before any of the app - not
    # just the Workflow tab - ever rendered.
    Scenario: The workflow tab renders real workflow content without a JS error
        When I open the job designer page
        And I switch to the workflow tab
        Then I see the workflow tab panel

    Scenario: Switching between material and workflow tabs does not throw
        When I open the job designer page
        And I switch to the workflow tab
        And I switch to the material tab
        And I switch to the workflow tab
        Then I see the workflow tab panel
