Feature: Job Designer standalone app loads and renders

    Scenario: The standalone app root element renders without errors
        When I open the job designer app
        Then I see the job designer root element

    Scenario: The app title is correct
        When I open the job designer app
        Then the page title contains "Job Designer"

    Scenario: The job designer heading is visible
        When I open the job designer app
        Then I see the job designer heading

    Scenario: All known job statuses are rendered as badges
        When I open the job designer app
        Then the status badges container exists
        And the pre_submission status badge is visible
        And the active status badge is visible
        And the finished status badge is visible
        And the error status badge is visible

    Scenario: Job status color classes are applied correctly
        When I open the job designer app
        Then the active status badge has the warning color class
        And the finished status badge has the success color class
        And the error status badge has the error color class

    # Regression coverage for a crash where job-designer's own reducers/components read
    # `job.workflow.*` expecting a live workflow instance (updateMethodData, isMultiMaterial,
    # usedApplications, subworkflows) - jode's `Job` class exposes that as `.workflowInstance`
    # instead, `.workflow` being just the raw JSON schema field. The bug threw synchronously
    # while building the job designer's Redux store, so it failed before any of the app - not
    # just the Workflow tab - ever rendered.
    Scenario: The workflow tab renders real workflow content without a JS error
        When I open the job designer app
        And I switch to the workflow tab
        Then the workflow tab panel is visible

    Scenario: Switching between material and workflow tabs does not throw
        When I open the job designer app
        And I switch to the workflow tab
        And I switch to the material tab
        And I switch to the workflow tab
        Then the workflow tab panel is visible
