import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import IconByName from "@mat3ra/cove/dist/mui/components/icon/IconByName";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import { canSubmitFromReport, getReportSummary, runPreflightChecks, } from "../preflight";
import { ANALYTICS_EVENTS, summarizeReportForAnalytics, trackEvent } from "../analytics";
import { getMessage } from "../messages";
/**
 * Icon and tone per outcome. Never colour alone — every state has a glyph, and
 * every glyph is a name cove's `IconByName` actually knows: an unmapped name
 * silently falls back to a plain Circle, which would make a failure look like
 * one more neutral row.
 */
const STATE_PRESENTATION = {
    pass: { iconName: "shapes.check", color: "success.main" },
    warn: { iconName: "shapes.info", color: "warning.main" },
    fail: { iconName: "actions.cancel", color: "error.main" },
    skip: { iconName: "shapes.circle", color: "text.disabled" },
};
/** One check's outcome, with whatever the reader can do about it. */
function PreflightRowView({ row, isAcknowledged, isExpanded, onToggleExpanded, onAcknowledge, onFix, }) {
    const presentation = STATE_PRESENTATION[row.state];
    const needsAcknowledgement = row.state === "warn" && !isAcknowledged;
    return (_jsxs(Box, { sx: { py: 1.25 }, id: `job-preflight-row-${row.id}`, "data-state": row.state, children: [_jsxs(Stack, { direction: "row", spacing: 1.5, alignItems: "flex-start", children: [_jsx(IconByName, { name: presentation.iconName, fontSize: "small", sx: { color: presentation.color, mt: 0.25 } }), _jsxs(Box, { sx: { flexGrow: 1, minWidth: 0 }, children: [_jsx(Typography, { variant: "body2", fontWeight: 600, children: row.label }), _jsx(Typography, { variant: "caption", color: "text.secondary", sx: { display: "block" }, children: row.detail })] }), _jsxs(Stack, { direction: "row", spacing: 0.5, alignItems: "center", flexShrink: 0, children: [row.explanation ? (_jsx(Button, { size: "small", onClick: onToggleExpanded, "aria-expanded": isExpanded, children: getMessage("preflight.details") })) : null, needsAcknowledgement ? (_jsx(Button, { size: "small", color: "warning", onClick: onAcknowledge, id: `job-preflight-ack-${row.id}`, children: getMessage("preflight.acknowledge") })) : null, isAcknowledged ? (_jsx(Typography, { variant: "caption", color: "text.secondary", children: getMessage("preflight.acknowledged") })) : null, row.fix ? (_jsx(Button, { size: "small", variant: "outlined", onClick: () => onFix(row.fix.stepId), id: `job-preflight-fix-${row.id}`, children: row.fix.label })) : null] })] }), row.explanation ? (_jsx(Collapse, { in: isExpanded, unmountOnExit: true, children: _jsx(Typography, { variant: "caption", color: "text.secondary", sx: { display: "block", pl: 4.5, pt: 1 }, children: row.explanation }) })) : null] }));
}
/**
 * The last look before a job is submitted.
 *
 * Today Submit fires immediately, and anything the job got wrong — a walltime
 * over the queue cap, a template that will not render, a batch that quietly
 * costs eight times what the reader expected — surfaces minutes later as a
 * failed run. The checks that can be made cheaply are made here instead, while
 * the reader is still in a position to change something.
 *
 * Three outcomes, and they mean different things: a `fail` blocks and offers the
 * step that fixes it; a `warn` is the reader's call and needs acknowledging; a
 * `skip` is this designer admitting it has no data to judge by, which is not the
 * same as approval.
 */
export default function PreflightDialog({ open, onClose, getContext, onSubmit, onGoToStep, }) {
    var _a;
    const [report, setReport] = React.useState(null);
    const [isRunning, setIsRunning] = React.useState(false);
    const [acknowledged, setAcknowledged] = React.useState([]);
    const [expandedRowId, setExpandedRowId] = React.useState(null);
    const getContextRef = React.useRef(getContext);
    getContextRef.current = getContext;
    const run = React.useCallback(async () => {
        setIsRunning(true);
        try {
            const nextReport = await runPreflightChecks(getContextRef.current());
            setReport(nextReport);
            // Which checks fail, not just how many — a check that fails often names
            // a step whose affordances still do not work.
            trackEvent(ANALYTICS_EVENTS.preflightCompleted, summarizeReportForAnalytics(nextReport));
            // Acknowledgements answer a specific report. Keep the ones whose
            // warning is still there — re-running after fixing something else
            // should not make the reader dismiss the same caveat again — and drop
            // the rest.
            setAcknowledged((previous) => previous.filter((id) => nextReport.warnings.includes(id)));
        }
        finally {
            setIsRunning(false);
        }
    }, []);
    React.useEffect(() => {
        if (!open)
            return;
        setAcknowledged([]);
        setExpandedRowId(null);
        setReport(null);
        run();
    }, [open, run]);
    const canSubmit = canSubmitFromReport(report, acknowledged);
    const handleFix = (stepId) => {
        // Low usage against a high fail rate means the deep link is not being found.
        trackEvent(ANALYTICS_EVENTS.preflightFixFollowed, { stepId });
        onClose();
        onGoToStep(stepId);
    };
    return (_jsxs(Dialog, { open: open, onClose: onClose, maxWidth: "sm", fullWidth: true, id: "job-preflight-dialog", children: [_jsxs(DialogTitle, { sx: { pb: 1 }, children: [_jsx(Typography, { variant: "h6", component: "span", children: getMessage("preflight.title") }), _jsx(Typography, { variant: "body2", color: "text.secondary", id: "job-preflight-summary", sx: { display: "block" }, children: isRunning
                            ? getMessage("preflight.running")
                            : getReportSummary(report, acknowledged) })] }), isRunning ? _jsx(LinearProgress, {}) : null, _jsx(DialogContent, { dividers: true, children: _jsxs(Stack, { divider: _jsx(Box, { sx: { borderTop: "1px solid", borderColor: "divider" } }), children: [((_a = report === null || report === void 0 ? void 0 : report.rows) !== null && _a !== void 0 ? _a : []).map((row) => (_jsx(PreflightRowView, { row: row, isAcknowledged: acknowledged.includes(row.id), isExpanded: expandedRowId === row.id, onToggleExpanded: () => setExpandedRowId(expandedRowId === row.id ? null : row.id), onAcknowledge: () => {
                                trackEvent(ANALYTICS_EVENTS.preflightWarningAcknowledged, {
                                    checkId: row.id,
                                });
                                setAcknowledged([...acknowledged, row.id]);
                            }, onFix: handleFix }, row.id))), !report && !isRunning ? (_jsx(Typography, { variant: "body2", color: "text.secondary", sx: { py: 2 }, children: getMessage("preflight.noChecks") })) : null] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, children: getMessage("preflight.back") }), _jsx(Button, { onClick: run, disabled: isRunning, id: "job-preflight-rerun", children: getMessage("preflight.rerun") }), _jsx(Button, { variant: "contained", onClick: onSubmit, disabled: !canSubmit || isRunning, id: "job-preflight-submit", children: getMessage("preflight.submit") })] })] }));
}
