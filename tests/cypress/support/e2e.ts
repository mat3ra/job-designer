// ***********************************************************
// This support/e2e.ts is processed and loaded automatically
// before your test files.
// ***********************************************************
import "./commands";

/**
 * Fail the run on console errors.
 *
 * `Job` renders its whole tree inside `<ErrorBoundary fallback={<div />}>`, so a crash in any tab
 * produces an EMPTY DIV rather than an uncaught exception - Cypress's default
 * uncaught-exception failure never fires, and a test would only notice indirectly (if at all)
 * through a missing-element assertion. React logs such caught errors via `console.error`, so
 * this turns them into real failures.
 *
 * It also catches React's "Maximum update depth exceeded", which matters here: the ported
 * `componentDidUpdate` in `Job.tsx` is a `useEffect` with no dependency array that calls
 * `persistJob()` whenever `shouldPersistJobOnUpdate` returns true. A runaway render loop would
 * otherwise just look like a slow test.
 *
 * Escape hatch while triaging: `cypress run --env ignoreConsoleErrors=true` collects and logs
 * without failing.
 */
const consoleErrors: string[] = [];

/** Per-test findings, reported together once the spec finishes - see the `after` hook. */
const offendingTests: { test: string; errors: string[] }[] = [];

/**
 * Narrowly allow-listed noise, matched as substrings. Keep this list as small as possible and
 * always comment WHY an entry is here - never widen it to make a real failure pass.
 */
const IGNORED_CONSOLE_ERRORS: string[] = [
    // wave.js's ThreeDEditor still uses legacy lifecycles; `React.StrictMode` in the standalone
    // demo (src/standalone/index.tsx) surfaces them as a warning. Third-party, not fixable here.
    "UNSAFE_componentWillReceiveProps",
];

/**
 * NOTE: deliberately a plain monkey-patch rather than `cy.stub(win.console, "error")`.
 * `cy.stub()` may only be invoked from a currently running test, but `window:before:load` also
 * fires outside test context - which throws a CypressError that aborts the whole run instead of
 * failing a single test. This version needs no command context, and it forwards to the original
 * `console.error` so the real message still reaches the browser console while debugging.
 */
Cypress.on("window:before:load", (win) => {
    const originalError = win.console.error;

    // eslint-disable-next-line no-param-reassign
    win.console.error = (...args: unknown[]) => {
        try {
            const message = args.map((arg) => String(arg)).join(" ");
            if (!IGNORED_CONSOLE_ERRORS.some((ignored) => message.includes(ignored))) {
                consoleErrors.push(message);
            }
        } catch {
            // Never let the collector itself break the app under test.
            consoleErrors.push("<unstringifiable console.error argument>");
        }
        originalError.apply(win.console, args as []);
    };
});

beforeEach(() => {
    consoleErrors.length = 0;
});

/**
 * Record rather than assert here. A throwing `afterEach` makes Mocha skip every remaining test in
 * the spec, so one noisy scenario would cost the whole suite (it did: 14 of 15 skipped). Findings
 * are aggregated and raised once in `after`, so all scenarios still run and the report names
 * every test that logged.
 */
afterEach(() => {
    if (!consoleErrors.length) return;

    const errors = [...new Set(consoleErrors)];
    consoleErrors.length = 0;

    if (Cypress.env("ignoreConsoleErrors")) {
        cy.log(`console.error output (ignored):\n${errors.join("\n---\n")}`);
        return;
    }

    offendingTests.push({ test: Cypress.currentTest?.title ?? "<unknown test>", errors });
});

after(() => {
    if (!offendingTests.length) return;

    const report = offendingTests
        .map(({ test, errors }) => {
            // First line only: these messages carry a full component stack, and the untruncated
            // text is already in the browser console because the patch above forwards to it.
            const summarised = errors.map((error) => `    - ${error.split("\n")[0]}`).join("\n");
            return `  • ${test}\n${summarised}`;
        })
        .join("\n\n");
    const count = offendingTests.length;
    offendingTests.length = 0;

    throw new Error(
        `console.error output in ${count} test(s). Fix the cause, or add a narrow entry to ` +
            `IGNORED_CONSOLE_ERRORS in cypress/support/e2e.ts if it is third-party noise:\n\n` +
            report,
    );
});
