import { getMessage } from "../messages";
import { getInjectedDeps } from "../setDependencies";
import { DEFAULT_PREFLIGHT_CHECKS } from "./checks";
import type { PreflightCheck, PreflightContext, PreflightReport, PreflightRow } from "./types";

/**
 * The default checks plus whatever the host injected. The webapp has checks
 * job-designer cannot make on its own — account balance, licence entitlements —
 * so it appends them through `setDependencies({ preflightChecks: [...] })`.
 */
export function getPreflightChecks(): PreflightCheck[] {
    const injected = (getInjectedDeps() as { preflightChecks?: unknown }).preflightChecks;
    const extra = Array.isArray(injected)
        ? injected.filter((check): check is PreflightCheck => typeof check === "function")
        : [];

    return [...DEFAULT_PREFLIGHT_CHECKS, ...extra];
}

async function runOne(
    check: PreflightCheck,
    context: PreflightContext,
): Promise<PreflightRow | null> {
    try {
        return await check(context);
    } catch (error) {
        return {
            id: `check-error-${check.name || "anonymous"}`,
            label: check.name || "Check",
            state: "skip",
            detail: getMessage("preflight.checkFailed"),
            explanation: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Runs the submit checks and reports what it found.
 *
 * Sequential rather than parallel, deliberately: `checkWorkflowRenders` mutates
 * the job entity, so the checks after it must see the rendered state, and the
 * rows appear in a fixed reading order either way.
 *
 * A check that throws does not take the report down with it — the reader gets a
 * `skip` row naming the check that broke, and submission is not blocked by our
 * own bug. Only a check that deliberately returns `fail` blocks.
 */
export async function runPreflightChecks(
    context: PreflightContext,
    checks: PreflightCheck[] = getPreflightChecks(),
): Promise<PreflightReport> {
    const rows = await checks.reduce<Promise<PreflightRow[]>>(async (previous, check) => {
        const collected = await previous;
        const row = await runOne(check, context);

        return row ? [...collected, row] : collected;
    }, Promise.resolve([]));

    return {
        rows,
        failures: rows.filter((row) => row.state === "fail").map((row) => row.id),
        warnings: rows.filter((row) => row.state === "warn").map((row) => row.id),
    };
}

/**
 * Whether Submit may proceed: nothing failed, and every warning has been
 * acknowledged. Kept beside the runner so the dialog's button and any
 * programmatic caller cannot come to different conclusions.
 */
export function canSubmitFromReport(
    report: PreflightReport | null,
    acknowledged: ReadonlySet<string> | string[] = [],
): boolean {
    if (!report) return false;
    if (report.failures.length) return false;

    const acknowledgedIds = Array.isArray(acknowledged) ? new Set(acknowledged) : acknowledged;

    return report.warnings.every((id) => acknowledgedIds.has(id));
}

/** One line for the dialog's header: what the report amounts to. */
export function getReportSummary(
    report: PreflightReport | null,
    acknowledged: ReadonlySet<string> | string[] = [],
): string {
    if (!report) return getMessage("preflight.running");

    const acknowledgedIds = Array.isArray(acknowledged) ? new Set(acknowledged) : acknowledged;
    const failures = report.failures.length;
    if (failures) {
        return failures === 1
            ? getMessage("preflight.oneProblem")
            : getMessage("preflight.problems", { count: failures });
    }

    const unacknowledged = report.warnings.filter((id) => !acknowledgedIds.has(id)).length;
    if (unacknowledged) {
        return unacknowledged === 1
            ? getMessage("preflight.oneWarning")
            : getMessage("preflight.warnings", { count: unacknowledged });
    }

    return getMessage("preflight.allPassed");
}
