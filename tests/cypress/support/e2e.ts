// ***********************************************************
// This support/e2e.ts is processed and loaded automatically
// before your test files.
// ***********************************************************
import "./commands";

/**
 * Fail tests on console errors.
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
 * Escape hatch while triaging: `cypress run --env ignoreConsoleErrors=true` (or the same key in
 * cypress.config.ts) collects and logs errors without failing.
 */
const consoleErrors: string[] = [];

/**
 * Narrowly allow-listed pre-existing noise, matched as substrings. Keep this list as small as
 * possible and always comment WHY an entry is here - never widen it to make a real failure pass.
 */
const IGNORED_CONSOLE_ERRORS: string[] = [];

/**
 * NOTE: deliberately a plain monkey-patch rather than `cy.stub(win.console, "error")`.
 * `cy.stub()` may only be invoked from a currently running test, but `window:before:load` also
 * fires outside test context - which throws a CypressError that aborts the whole run instead of
 * failing a single test. This version needs no command context, and it forwards to the original
 * `console.error` so the real message still shows up in the browser console while debugging.
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

afterEach(() => {
    const errors = [...consoleErrors];
    consoleErrors.length = 0;

    if (!errors.length) return;

    if (Cypress.env("ignoreConsoleErrors")) {
        cy.log(`console.error output (ignored):\n${errors.join("\n---\n")}`);
        return;
    }

    expect(errors, `unexpected console.error output:\n${errors.join("\n---\n")}`).to.have.length(0);
});
