import IconByName from "@mat3ra/cove/dist/mui/components/icon/IconByName";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";

import type { ReadinessState, ReadinessStep } from "../jobReadiness";
import { getMessage } from "../messages";

/** Icon and tone per step state. Never color alone — every state has a glyph. */
const STATE_PRESENTATION: Record<
    ReadinessState,
    { iconName: string; color: string; isMuted?: boolean }
> = {
    complete: { iconName: "shapes.check", color: "success.main" },
    attention: { iconName: "shapes.info", color: "warning.main" },
    empty: { iconName: "shapes.circle", color: "text.disabled", isMuted: true },
    unavailable: { iconName: "shapes.lock", color: "text.disabled", isMuted: true },
};

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
export default function JobReadinessRail({
    steps,
    activeStepId,
    onSelect,
    onChange = {},
    editable = true,
    children,
}: JobReadinessRailProps) {
    const stepRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

    const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
        const offset = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
        if (!offset) return;

        event.preventDefault();
        const nextIndex = (index + offset + steps.length) % steps.length;
        stepRefs.current[nextIndex]?.focus();
    };

    return (
        <Stack
            component="nav"
            aria-label="Job steps"
            id="job-readiness-rail"
            sx={{
                // Under the md breakpoint the rail becomes a horizontal strip that
                // scrolls: stacked full-width rows would push the step's own
                // content off a narrow screen entirely.
                flexDirection: { xs: "row", md: "column" },
                overflowX: { xs: "auto", md: "visible" },
                borderRight: { md: "1px solid" },
                borderBottom: { xs: "1px solid", md: "none" },
                borderColor: "divider",
                p: 1,
                minWidth: { md: 260 },
                maxWidth: { md: 320 },
                gap: 0.25,
            }}
        >
            {steps.map((step, index) => {
                const presentation = STATE_PRESENTATION[step.state];
                const isActive = step.id === activeStepId;
                const change = editable ? onChange[step.id] : undefined;

                return (
                    // A sibling, not a child: the step row is a button, and a
                    // button inside a button is invalid and unreachable by
                    // keyboard.
                    <Stack
                        key={step.id}
                        direction="row"
                        alignItems="center"
                        sx={{
                            borderRadius: 1,
                            bgcolor: isActive ? "action.selected" : "transparent",
                            "&:hover": { bgcolor: "action.hover" },
                            flexShrink: { xs: 0, md: 1 },
                        }}
                    >
                        <ButtonBase
                            ref={(node) => {
                                stepRefs.current[index] = node as HTMLButtonElement | null;
                            }}
                            id={`job-step-${step.id}`}
                            aria-current={isActive ? "step" : undefined}
                            disabled={step.state === "unavailable"}
                            onClick={() => onSelect(step.id)}
                            onKeyDown={(event) => handleKeyDown(event, index)}
                            sx={{
                                flexGrow: 1,
                                justifyContent: "flex-start",
                                gap: 1.25,
                                px: 1.5,
                                py: 1.25,
                                borderRadius: 1,
                                textAlign: "left",
                                minWidth: 0,
                                "&.Mui-focusVisible": {
                                    outline: "2px solid",
                                    outlineColor: "primary.main",
                                },
                            }}
                        >
                            <IconByName
                                name={presentation.iconName}
                                fontSize="small"
                                sx={{ color: presentation.color }}
                            />
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={600} noWrap>
                                    {step.label}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color={
                                        step.state === "attention"
                                            ? "warning.main"
                                            : "text.secondary"
                                    }
                                    noWrap
                                    sx={{ display: "block" }}
                                >
                                    {step.summary}
                                </Typography>
                            </Box>
                        </ButtonBase>

                        {change ? (
                            <Button
                                id={`job-step-change-${step.id}`}
                                size="small"
                                onClick={change}
                                sx={{ flexShrink: 0, mr: 0.5 }}
                                // Names the step, so a screen reader hears
                                // "Choose material" rather than four identical
                                // "Choose" buttons.
                                aria-label={`${getMessage("rail.change")} ${step.label}`}
                            >
                                {step.state === "empty"
                                    ? getMessage("rail.choose")
                                    : getMessage("rail.change")}
                            </Button>
                        ) : null}
                    </Stack>
                );
            })}

            {children ? (
                <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
                    {children}
                </Box>
            ) : null}
        </Stack>
    );
}
