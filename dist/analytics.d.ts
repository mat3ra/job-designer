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
export declare const ANALYTICS_EVENTS: {
    /**
     * A designer was opened on a draft. Paired with `jobSubmitted` this gives
     * **time to first submit**, the headline number the redesign should move.
     */
    readonly designerOpened: "job_designer.opened";
    /** A draft was submitted. Carries the seconds since the designer opened. */
    readonly jobSubmitted: "job_designer.submitted";
    /**
     * The preflight finished a run. Carries per-outcome counts and which checks
     * failed — a check that fails often names a step whose affordances still do
     * not work, which is more actionable than the submit rate alone.
     */
    readonly preflightCompleted: "job_designer.preflight_completed";
    /**
     * A reader followed a preflight row's fix to its step. Low usage against a
     * high fail rate means the deep link is not being found.
     */
    readonly preflightFixFollowed: "job_designer.preflight_fix_followed";
    /** A warning was acknowledged rather than acted on. */
    readonly preflightWarningAcknowledged: "job_designer.preflight_warning_acknowledged";
    /**
     * The reader moved between steps. The step a session ends on is where the
     * **abandonment** happens.
     */
    readonly stepSelected: "job_designer.step_selected";
    /**
     * A job was terminated soon after being submitted — a proxy for "submitted
     * with the wrong settings", which the estimate and preflight should reduce.
     */
    readonly jobTerminated: "job_designer.terminated";
};
export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];
export type AnalyticsProperties = Record<string, unknown>;
export type TrackEventFunction = (event: string, properties?: AnalyticsProperties) => void;
/**
 * Records an event, if the host is listening.
 *
 * Swallows a throwing recorder deliberately: analytics is the least important
 * thing on the page, and an instrumentation bug must never be what stops
 * somebody submitting a job.
 */
export declare function trackEvent(event: AnalyticsEvent, properties?: AnalyticsProperties): void;
/**
 * Seconds between two timestamps, for the duration properties. Returns undefined
 * rather than a negative or absurd number when the start is missing, so a
 * dashboard is never asked to average nonsense.
 */
export declare function durationSince(startedAtMs?: number, nowMs?: number): number | undefined;
/** The shape of a preflight report, reduced to what is worth recording. */
export declare function summarizeReportForAnalytics(report: {
    rows: Array<{
        id: string;
        state: string;
    }>;
}): AnalyticsProperties;
//# sourceMappingURL=analytics.d.ts.map