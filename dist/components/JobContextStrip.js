import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
/** Steps whose selections are worth carrying on every screen. */
const CONTEXT_STEP_IDS = new Set(["material", "dataset", "workflow", "compute"]);
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
export default function JobContextStrip({ steps, onSelect, parentJob, onParentRemove, estimateLabel, }) {
    const contextSteps = steps.filter((step) => CONTEXT_STEP_IDS.has(step.id));
    if (!contextSteps.length && !parentJob)
        return null;
    return (_jsxs(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", useFlexGap: true, alignItems: "center", id: "job-context-strip", sx: { px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider" }, children: [contextSteps.map((step) => {
                const needsAttention = step.state !== "complete";
                return (_jsx(Chip, { id: `job-context-${step.id}`, size: "small", variant: "outlined", color: needsAttention ? "warning" : "default", onClick: () => onSelect(step.id), label: _jsxs(Stack, { direction: "row", spacing: 0.75, alignItems: "baseline", children: [_jsx(Typography, { variant: "caption", color: "text.secondary", sx: { textTransform: "uppercase", letterSpacing: ".06em" }, children: step.label }), _jsx(Typography, { variant: "caption", fontWeight: 600, children: step.summary })] }) }, step.id));
            }), estimateLabel ? (_jsx(Chip, { id: "job-context-estimate", size: "small", variant: "outlined", onClick: () => onSelect("compute"), label: _jsxs(Stack, { direction: "row", spacing: 0.75, alignItems: "baseline", children: [_jsx(Typography, { variant: "caption", color: "text.secondary", sx: { textTransform: "uppercase", letterSpacing: ".06em" }, children: "Estimate" }), _jsx(Typography, { variant: "caption", fontWeight: 600, children: estimateLabel })] }) })) : null, parentJob ? (_jsx(Chip, { id: "job-context-parent", size: "small", variant: "outlined", color: "info", onDelete: onParentRemove, label: _jsxs(Stack, { direction: "row", spacing: 0.75, alignItems: "baseline", children: [_jsx(Typography, { variant: "caption", color: "text.secondary", sx: { textTransform: "uppercase", letterSpacing: ".06em" }, children: "Parent" }), _jsxs(Typography, { variant: "caption", fontWeight: 600, children: [parentJob.name, parentJob.projectSlug ? ` · ${parentJob.projectSlug}` : ""] })] }) })) : null] }));
}
