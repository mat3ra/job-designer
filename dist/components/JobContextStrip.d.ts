import React from "react";
import type { ReadinessStep } from "../jobReadiness";
export interface JobContextStripProps {
    steps: ReadinessStep[];
    onSelect: (stepId: string) => void;
    /** Parent job, when this job derives from one. Removable while editable. */
    parentJob?: {
        name?: string;
        projectSlug?: string;
    } | null;
    onParentRemove?: () => void;
}
/**
 * The job's selections, visible from every step.
 *
 * Checking which material a job will run on used to mean leaving the step you
 * were on — the Compute tab showed no trace of the material or workflow, and
 * vice versa. Each chip is also the way back to the step that owns it.
 *
 * The parent job lives here too. It used to be a dismissable `Alert` sitting
 * above the tabs, which is a lot of screen for one fact and put a destructive
 * "unset parent" behind an X that reads as "hide this message".
 */
export default function JobContextStrip({ steps, onSelect, parentJob, onParentRemove, }: JobContextStripProps): React.JSX.Element;
//# sourceMappingURL=JobContextStrip.d.ts.map