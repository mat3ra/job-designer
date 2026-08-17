import { getInjectedDeps } from "./setDependencies";
/**
 * The events the guided designer emits, and why each one is worth having.
 *
 * The plan asks for a baseline before the `useGuidedDesigner` flag flips —
 * otherwise "did the redesign help?" is answerable only by opinion. These are
 * the measurements that would settle it, and they are declared here rather than
 * scattered as string literals so the set can be read in one go and a host can
 * see exactly what it is being asked to record.
 *
 * No-op without a host recorder. Nothing here reaches the network on its own,
 * and the standalone demo emits into the void.
 */
export const ANALYTICS_EVENTS = {
    /**
     * A designer was opened on a draft. Paired with `jobSubmitted` this gives
     * **time to first submit**, the headline number the redesign should move.
     */
    designerOpened: "job_designer.opened",
    /** A draft was submitted. Carries the seconds since the designer opened. */
    jobSubmitted: "job_designer.submitted",
    /**
     * The preflight finished a run. Carries per-outcome counts and which checks
     * failed — a check that fails often names a step whose affordances still do
     * not work, which is more actionable than the submit rate alone.
     */
    preflightCompleted: "job_designer.preflight_completed",
    /**
     * A reader followed a preflight row's fix to its step. Low usage against a
     * high fail rate means the deep link is not being found.
     */
    preflightFixFollowed: "job_designer.preflight_fix_followed",
    /** A warning was acknowledged rather than acted on. */
    preflightWarningAcknowledged: "job_designer.preflight_warning_acknowledged",
    /**
     * The reader moved between steps. The step a session ends on is where the
     * **abandonment** happens.
     */
    stepSelected: "job_designer.step_selected",
    /**
     * A job was terminated soon after being submitted — a proxy for "submitted
     * with the wrong settings", which the estimate and preflight should reduce.
     */
    jobTerminated: "job_designer.terminated",
};
/**
 * Records an event, if the host is listening.
 *
 * Swallows a throwing recorder deliberately: analytics is the least important
 * thing on the page, and an instrumentation bug must never be what stops
 * somebody submitting a job.
 */
export function trackEvent(event, properties) {
    const { trackEvent: track } = getInjectedDeps();
    if (typeof track !== "function")
        return;
    try {
        track(event, properties);
    }
    catch (_a) {
        // Deliberately silent — see above.
    }
}
/**
 * Seconds between two timestamps, for the duration properties. Returns undefined
 * rather than a negative or absurd number when the start is missing, so a
 * dashboard is never asked to average nonsense.
 */
export function durationSince(startedAtMs, nowMs) {
    if (!startedAtMs)
        return undefined;
    const elapsed = ((nowMs !== null && nowMs !== void 0 ? nowMs : Date.now()) - startedAtMs) / 1000;
    return elapsed >= 0 ? Math.round(elapsed) : undefined;
}
/** The shape of a preflight report, reduced to what is worth recording. */
export function summarizeReportForAnalytics(report) {
    const countOf = (state) => report.rows.filter((row) => row.state === state).length;
    return {
        checks: report.rows.length,
        passed: countOf("pass"),
        warned: countOf("warn"),
        failed: countOf("fail"),
        skipped: countOf("skip"),
        // Which checks, not just how many: "compute fails 40% of the time" points
        // at a step, where "1.4 failures per run" points at nothing.
        failedChecks: report.rows.filter((row) => row.state === "fail").map((row) => row.id),
    };
}
