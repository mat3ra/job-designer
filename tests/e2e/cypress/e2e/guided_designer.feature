Feature: The guided designer takes a job from draft to running

    The flow SOF-8023 introduced: a rail that says what a job still needs, a
    context strip that keeps the other choices visible, a preflight that refuses
    to submit something broken, and a monitor once it runs.

    Background:
        Given I open the guided job designer

    Scenario: The rail says what the job still needs
        Then the readiness rail is visible
        And the rail step "material" reads "Si"
        And the rail step "compute" reads "Cluster and resources needed"
        And the rail step "review" reads "1 step remaining"
        And the submit button is disabled

    Scenario: A disabled Submit names the first thing missing
        Then the submit button explains "Configure compute"

    Scenario: The context strip keeps the other choices visible and navigates
        Then the context strip is visible
        And the context chip "workflow" is visible
        When I click the context chip "compute"
        Then the rail step "compute" is the current step

    Scenario: Choosing a cluster completes the compute step
        When I configure compute on "cluster-007" with 1 nodes and 16 cores for "04:00:00"
        Then the rail step "compute" reads "cluster-007.exabyte.io · 1×16 · 04:00:00"
        And the rail step "review" reads "Ready to submit"
        And the estimate chip reads "64 core·h ≈ $5.12"
        And the submit button is enabled

    Scenario: Submit runs a preflight, and every check passes on a ready job
        When I configure compute on "cluster-007" with 1 nodes and 16 cores for "04:00:00"
        And I click submit
        Then the preflight dialog is open
        And the preflight summary reads "All checks passed"
        And the preflight row "inputs" passed
        And the preflight row "workflow" passed
        And the preflight row "compute" passed
        And the preflight row "saved" passed
        And the preflight submit button is enabled

    Scenario: A configuration over the cluster's limits never reaches the preflight
        When I configure compute on "cluster-007" with 1 nodes and 16 cores for "24:00:00"
        Then the rail step "compute" reads "over the 12 h queue limit"
        And the submit button is disabled
        And the submit button explains "Bring compute within the cluster's limits"

    Scenario: A job within limits but over quota fails the preflight, and the fix deep-links
        When I configure compute on "cluster-007" with 4 nodes and 32 cores for "12:00:00"
        And I click submit
        Then the preflight summary reads "1 problem to fix"
        And the preflight row "budget" failed
        And the preflight submit button is disabled
        When I follow the preflight fix for "budget"
        Then the preflight dialog is closed
        And the rail step "compute" is the current step

    Scenario: A warning holds Submit until it is acknowledged
        When I configure compute on "cluster-007" with 4 nodes and 32 cores for "03:00:00"
        And I click submit
        Then the preflight summary reads "1 warning to acknowledge"
        And the preflight submit button is disabled
        When I acknowledge the preflight warning "budget"
        Then the preflight summary reads "All checks passed"
        And the preflight submit button is enabled

    Scenario: The materials tray states the batch consequence
        When I open the rail step "material"
        Then the materials tray is visible
        And the batch note is visible

    Scenario: A running job shows the monitor instead of the submit flow
        When I switch the demo job to running
        Then the rail step "results" reads "Running"
        And the submit button is absent
        When I open the rail step "results"
        Then the run monitor is visible
        And the run monitor lists the workflow's units

    Scenario: The legacy layout is untouched
        When I turn the guided layout off
        Then the readiness rail is absent
        And the numbered tab strip is visible
