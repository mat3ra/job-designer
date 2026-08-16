import React from "react";
import type { ReadinessStep } from "../jobReadiness";
export interface JobReadinessRailProps {
    steps: ReadinessStep[];
    activeStepId: string;
    onSelect: (stepId: string) => void;
    /** Rendered under the steps — parent job, import, and other power actions. */
    children?: React.ReactNode;
}
/**
 * The job's lifecycle, with its current state on show.
 *
 * Replaces the numbered tab strip. Those tabs implied a sequence — "1. Materials,
 * 2. Workflow, 3. Compute" — while looking identical whether a step was done or
 * untouched, and the actions that complete them lived in a dropdown. Each row
 * here carries its own state and a line saying what is chosen.
 *
 * Keyboard: the steps are a toolbar of buttons, arrow keys move between them,
 * and the active one carries `aria-current`.
 */
export default function JobReadinessRail({ steps, activeStepId, onSelect, children, }: JobReadinessRailProps): React.JSX.Element;
//# sourceMappingURL=JobReadinessRail.d.ts.map