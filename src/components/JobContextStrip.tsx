import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";

import type { ReadinessStep } from "../jobReadiness";

export interface JobContextStripProps {
    steps: ReadinessStep[];
    onSelect: (stepId: string) => void;
    /** Parent job, when this job derives from one. Removable while editable. */
    parentJob?: { name?: string; projectSlug?: string } | null;
    onParentRemove?: () => void;
    /**
     * Pre-formatted core-hours and cost from `estimateComputeUsage`. Absent when
     * the compute configuration is incomplete or the host published no pricing —
     * the chip is then left out rather than shown empty or as zero.
     */
    estimateLabel?: string;
}

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
export default function JobContextStrip({
    steps,
    onSelect,
    parentJob,
    onParentRemove,
    estimateLabel,
}: JobContextStripProps) {
    const contextSteps = steps.filter((step) => CONTEXT_STEP_IDS.has(step.id));
    if (!contextSteps.length && !parentJob) return null;

    return (
        <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            alignItems="center"
            id="job-context-strip"
            sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider" }}
        >
            {contextSteps.map((step) => {
                const needsAttention = step.state !== "complete";

                return (
                    <Chip
                        key={step.id}
                        id={`job-context-${step.id}`}
                        size="small"
                        variant="outlined"
                        color={needsAttention ? "warning" : "default"}
                        onClick={() => onSelect(step.id)}
                        label={
                            <Stack direction="row" spacing={0.75} alignItems="baseline">
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ textTransform: "uppercase", letterSpacing: ".06em" }}
                                >
                                    {step.label}
                                </Typography>
                                <Typography variant="caption" fontWeight={600}>
                                    {step.summary}
                                </Typography>
                            </Stack>
                        }
                    />
                );
            })}

            {estimateLabel ? (
                <Chip
                    id="job-context-estimate"
                    size="small"
                    variant="outlined"
                    onClick={() => onSelect("compute")}
                    label={
                        <Stack direction="row" spacing={0.75} alignItems="baseline">
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ textTransform: "uppercase", letterSpacing: ".06em" }}
                            >
                                Estimate
                            </Typography>
                            <Typography variant="caption" fontWeight={600}>
                                {estimateLabel}
                            </Typography>
                        </Stack>
                    }
                />
            ) : null}

            {parentJob ? (
                <Chip
                    id="job-context-parent"
                    size="small"
                    variant="outlined"
                    color="info"
                    onDelete={onParentRemove}
                    label={
                        <Stack direction="row" spacing={0.75} alignItems="baseline">
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ textTransform: "uppercase", letterSpacing: ".06em" }}
                            >
                                Parent
                            </Typography>
                            <Typography variant="caption" fontWeight={600}>
                                {parentJob.name}
                                {parentJob.projectSlug ? ` · ${parentJob.projectSlug}` : ""}
                            </Typography>
                        </Stack>
                    }
                />
            ) : null}
        </Stack>
    );
}
