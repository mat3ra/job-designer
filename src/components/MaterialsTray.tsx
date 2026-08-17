import IconByName from "@mat3ra/cove/dist/mui/components/icon/IconByName";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";

import { getBatchDescription, getMaterialSummary } from "../materialSummary";

export interface MaterialsTrayProps {
    materials: any[];
    /** Index of the material currently in the viewer. */
    activeIndex: number;
    onSelect: (index: number) => void;
    onRemove?: () => void;
    onAdd?: () => void;
    /** False once the job is saved — its material set is fixed by then. */
    editable?: boolean;
}

/**
 * The job's materials, above the viewer.
 *
 * Two things were previously unavailable here: switching between materials in a
 * multi-material job lived inside the *Workflow* tab, nowhere near the material
 * being looked at; and a materials set silently turns one job into N, which the
 * designer never said out loud.
 */
export default function MaterialsTray({
    materials,
    activeIndex,
    onSelect,
    onRemove,
    onAdd,
    editable = true,
}: MaterialsTrayProps) {
    if (!materials?.length) return null;

    const isBatch = materials.length > 1;

    return (
        <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ px: 2, pt: 2 }}
            id="job-materials-tray"
        >
            {materials.map((material, index) => {
                const { formula, name } = getMaterialSummary(material);
                const isActive = index === activeIndex;

                return (
                    <Chip
                        key={name ?? index}
                        size="small"
                        variant={isActive ? "filled" : "outlined"}
                        color={isActive ? "primary" : "default"}
                        label={formula ?? name ?? `Material ${index + 1}`}
                        title={name}
                        onClick={() => onSelect(index)}
                        // Only the material on screen can be removed: the callback the
                        // host gives us acts on the active one.
                        onDelete={editable && isActive && onRemove ? onRemove : undefined}
                    />
                );
            })}

            {editable && onAdd ? (
                <Button
                    size="small"
                    startIcon={<IconByName name="actions.add" fontSize="small" />}
                    onClick={onAdd}
                >
                    Add material
                </Button>
            ) : null}

            <Box sx={{ flexGrow: 1 }} />

            <Typography
                variant="caption"
                color={isBatch ? "text.primary" : "text.secondary"}
                id="job-materials-batch-note"
            >
                {getBatchDescription(materials.length)}
            </Typography>
        </Stack>
    );
}
