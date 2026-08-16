import type { PreflightCheck, PreflightContext, PreflightReport } from "./types";
/**
 * The default checks plus whatever the host injected. The webapp has checks
 * job-designer cannot make on its own — account balance, licence entitlements —
 * so it appends them through `setDependencies({ preflightChecks: [...] })`.
 */
export declare function getPreflightChecks(): PreflightCheck[];
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
export declare function runPreflightChecks(context: PreflightContext, checks?: PreflightCheck[]): Promise<PreflightReport>;
/**
 * Whether Submit may proceed: nothing failed, and every warning has been
 * acknowledged. Kept beside the runner so the dialog's button and any
 * programmatic caller cannot come to different conclusions.
 */
export declare function canSubmitFromReport(report: PreflightReport | null, acknowledged?: ReadonlySet<string> | string[]): boolean;
/** One line for the dialog's header: what the report amounts to. */
export declare function getReportSummary(report: PreflightReport | null, acknowledged?: ReadonlySet<string> | string[]): string;
//# sourceMappingURL=runPreflightChecks.d.ts.map