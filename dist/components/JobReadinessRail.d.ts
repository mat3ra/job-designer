import React from "react";
import type { ReadinessStep } from "../jobReadiness";
export interface JobReadinessRailProps {
    steps: ReadinessStep[];
    activeStepId: string;
    onSelect: (stepId: string) => void;
    /**
     * Opens the "Select …" dialog that fills a step, keyed by step id. A step
     * with no entry gets no Change affordance — Review has nothing to choose.
     *
     * This is what makes the rail a creation path rather than just navigation:
     * without it the only way to pick a material or a workflow is still the
     * actions dropdown, which is the thing the rail exists to replace.
     */
    onChange?: Record<string, (() => void) | undefined>;
    /** False for shared or finished jobs: the rail renders without Change. */
    editable?: boolean;
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
export default function JobReadinessRail({ steps, activeStepId, onSelect, onChange, editable, children, }: JobReadinessRailProps): React.JSX.Element;
//# sourceMappingURL=JobReadinessRail.d.ts.map