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
 */
const consoleErrors: string[] = [];

/**
 * Narrowly allow-listed pre-existing noise, matched as substrings. Keep this list as small as
 * possible and always comment WHY an entry is here - never widen it to make a real failure pass.
 */
const IGNORED_CONSOLE_ERRORS: string[] = [];

Cypress.on("window:before:load", (win) => {
    cy.stub(win.console, "error").callsFake((...args: unknown[]) => {
        const message = args.map((arg) => String(arg)).join(" ");
        if (!IGNORED_CONSOLE_ERRORS.some((ignored) => message.includes(ignored))) {
            consoleErrors.push(message);
        }
    });
});

beforeEach(() => {
    consoleErrors.length = 0;
});

afterEach(() => {
    const errors = [...consoleErrors];
    consoleErrors.length = 0;
    expect(errors, `unexpected console.error output:\n${errors.join("\n---\n")}`).to.have.length(0);
});
