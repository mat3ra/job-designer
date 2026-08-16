import IconByName from "@mat3ra/cove/dist/mui/components/icon/IconByName";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";

import type { ReadinessState, ReadinessStep } from "../jobReadiness";

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
                borderRight: { md: "1px solid" },
                borderBottom: { xs: "1px solid", md: "none" },
                borderColor: { xs: "divider", md: "divider" },
                p: 1,
                minWidth: { md: 260 },
                gap: 0.25,
            }}
        >
            {steps.map((step, index) => {
                const presentation = STATE_PRESENTATION[step.state];
                const isActive = step.id === activeStepId;

                return (
                    <ButtonBase
                        key={step.id}
                        ref={(node) => {
                            stepRefs.current[index] = node as HTMLButtonElement | null;
                        }}
                        id={`job-step-${step.id}`}
                        aria-current={isActive ? "step" : undefined}
                        disabled={step.state === "unavailable"}
                        onClick={() => onSelect(step.id)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        sx={{
                            justifyContent: "flex-start",
                            gap: 1.25,
                            px: 1.5,
                            py: 1.25,
                            borderRadius: 1,
                            textAlign: "left",
                            bgcolor: isActive ? "action.selected" : "transparent",
                            "&:hover": { bgcolor: "action.hover" },
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
                                    step.state === "attention" ? "warning.main" : "text.secondary"
                                }
                                noWrap
                                sx={{ display: "block" }}
                            >
                                {step.summary}
                            </Typography>
                        </Box>
                    </ButtonBase>
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
