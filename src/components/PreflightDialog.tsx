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

import {
    canSubmitFromReport,
    getReportSummary,
    type PreflightContext,
    type PreflightReport,
    type PreflightRow,
    type PreflightState,
    runPreflightChecks,
} from "../preflight";

/**
 * Icon and tone per outcome. Never colour alone — every state has a glyph, and
 * every glyph is a name cove's `IconByName` actually knows: an unmapped name
 * silently falls back to a plain Circle, which would make a failure look like
 * one more neutral row.
 */
const STATE_PRESENTATION: Record<PreflightState, { iconName: string; color: string }> = {
    pass: { iconName: "shapes.check", color: "success.main" },
    warn: { iconName: "shapes.info", color: "warning.main" },
    fail: { iconName: "actions.cancel", color: "error.main" },
    skip: { iconName: "shapes.circle", color: "text.disabled" },
};

export interface PreflightDialogProps {
    open: boolean;
    onClose: () => void;
    /**
     * What to check, read at the moment the checks run. A getter rather than the
     * context itself: the job is mutated in place, so a value captured at render
     * time would have the checks judging a stale copy, and a fresh object each
     * render would restart them — losing the reader's acknowledgements — every
     * time anything else on the page changed.
     */
    getContext: () => PreflightContext;
    /** Called once the report allows it — the designer's existing submit path. */
    onSubmit: () => void;
    /** Sends the reader to the step that fixes a row, closing the dialog. */
    onGoToStep: (stepId: string) => void;
}

/** One check's outcome, with whatever the reader can do about it. */
function PreflightRowView({
    row,
    isAcknowledged,
    isExpanded,
    onToggleExpanded,
    onAcknowledge,
    onFix,
}: {
    row: PreflightRow;
    isAcknowledged: boolean;
    isExpanded: boolean;
    onToggleExpanded: () => void;
    onAcknowledge: () => void;
    onFix: (stepId: string) => void;
}) {
    const presentation = STATE_PRESENTATION[row.state];
    const needsAcknowledgement = row.state === "warn" && !isAcknowledged;

    return (
        <Box sx={{ py: 1.25 }} id={`job-preflight-row-${row.id}`} data-state={row.state}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <IconByName
                    name={presentation.iconName}
                    fontSize="small"
                    sx={{ color: presentation.color, mt: 0.25 }}
                />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600}>
                        {row.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {row.detail}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
                    {row.explanation ? (
                        <Button size="small" onClick={onToggleExpanded} aria-expanded={isExpanded}>
                            Details
                        </Button>
                    ) : null}
                    {needsAcknowledgement ? (
                        <Button
                            size="small"
                            color="warning"
                            onClick={onAcknowledge}
                            id={`job-preflight-ack-${row.id}`}
                        >
                            Acknowledge
                        </Button>
                    ) : null}
                    {isAcknowledged ? (
                        <Typography variant="caption" color="text.secondary">
                            Acknowledged
                        </Typography>
                    ) : null}
                    {row.fix ? (
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onFix(row.fix!.stepId)}
                            id={`job-preflight-fix-${row.id}`}
                        >
                            {row.fix.label}
                        </Button>
                    ) : null}
                </Stack>
            </Stack>

            {row.explanation ? (
                <Collapse in={isExpanded} unmountOnExit>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", pl: 4.5, pt: 1 }}
                    >
                        {row.explanation}
                    </Typography>
                </Collapse>
            ) : null}
        </Box>
    );
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
export default function PreflightDialog({
    open,
    onClose,
    getContext,
    onSubmit,
    onGoToStep,
}: PreflightDialogProps) {
    const [report, setReport] = React.useState<PreflightReport | null>(null);
    const [isRunning, setIsRunning] = React.useState(false);
    const [acknowledged, setAcknowledged] = React.useState<string[]>([]);
    const [expandedRowId, setExpandedRowId] = React.useState<string | null>(null);

    const getContextRef = React.useRef(getContext);
    getContextRef.current = getContext;

    const run = React.useCallback(async () => {
        setIsRunning(true);
        try {
            const nextReport = await runPreflightChecks(getContextRef.current());
            setReport(nextReport);
            // Acknowledgements answer a specific report. Keep the ones whose
            // warning is still there — re-running after fixing something else
            // should not make the reader dismiss the same caveat again — and drop
            // the rest.
            setAcknowledged((previous) =>
                previous.filter((id) => nextReport.warnings.includes(id)),
            );
        } finally {
            setIsRunning(false);
        }
    }, []);

    React.useEffect(() => {
        if (!open) return;

        setAcknowledged([]);
        setExpandedRowId(null);
        setReport(null);
        run();
    }, [open, run]);

    const canSubmit = canSubmitFromReport(report, acknowledged);

    const handleFix = (stepId: string) => {
        onClose();
        onGoToStep(stepId);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth id="job-preflight-dialog">
            <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h6" component="span">
                    Preflight
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    id="job-preflight-summary"
                    sx={{ display: "block" }}
                >
                    {isRunning ? "Running checks…" : getReportSummary(report, acknowledged)}
                </Typography>
            </DialogTitle>

            {isRunning ? <LinearProgress /> : null}

            <DialogContent dividers>
                <Stack divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}>
                    {(report?.rows ?? []).map((row) => (
                        <PreflightRowView
                            key={row.id}
                            row={row}
                            isAcknowledged={acknowledged.includes(row.id)}
                            isExpanded={expandedRowId === row.id}
                            onToggleExpanded={() =>
                                setExpandedRowId(expandedRowId === row.id ? null : row.id)
                            }
                            onAcknowledge={() => setAcknowledged([...acknowledged, row.id])}
                            onFix={handleFix}
                        />
                    ))}
                    {!report && !isRunning ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                            No checks ran.
                        </Typography>
                    ) : null}
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Back to designer</Button>
                <Button onClick={run} disabled={isRunning} id="job-preflight-rerun">
                    Re-run checks
                </Button>
                <Button
                    variant="contained"
                    onClick={onSubmit}
                    disabled={!canSubmit || isRunning}
                    id="job-preflight-submit"
                >
                    Submit job
                </Button>
            </DialogActions>
        </Dialog>
    );
}
