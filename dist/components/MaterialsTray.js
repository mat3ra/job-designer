import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import IconByName from "@mat3ra/cove/dist/mui/components/icon/IconByName";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getBatchDescription, getMaterialSummary } from "../materialSummary";
/**
 * The job's materials, above the viewer.
 *
 * Two things were previously unavailable here: switching between materials in a
 * multi-material job lived inside the *Workflow* tab, nowhere near the material
 * being looked at; and a materials set silently turns one job into N, which the
 * designer never said out loud.
 */
export default function MaterialsTray({ materials, activeIndex, onSelect, onRemove, onAdd, editable = true, }) {
    if (!(materials === null || materials === void 0 ? void 0 : materials.length))
        return null;
    const isBatch = materials.length > 1;
    return (_jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", flexWrap: "wrap", useFlexGap: true, sx: { px: 2, pt: 2 }, id: "job-materials-tray", children: [materials.map((material, index) => {
                var _a;
                const { formula, name } = getMaterialSummary(material);
                const isActive = index === activeIndex;
                return (_jsx(Chip, { size: "small", variant: isActive ? "filled" : "outlined", color: isActive ? "primary" : "default", label: (_a = formula !== null && formula !== void 0 ? formula : name) !== null && _a !== void 0 ? _a : `Material ${index + 1}`, title: name, onClick: () => onSelect(index), 
                    // Only the material on screen can be removed: the callback the
                    // host gives us acts on the active one.
                    onDelete: editable && isActive && onRemove ? onRemove : undefined }, name !== null && name !== void 0 ? name : index));
            }), editable && onAdd ? (_jsx(Button, { size: "small", startIcon: _jsx(IconByName, { name: "actions.add", fontSize: "small" }), onClick: onAdd, children: "Add material" })) : null, _jsx(Box, { sx: { flexGrow: 1 } }), _jsx(Typography, { variant: "caption", color: isBatch ? "text.primary" : "text.secondary", id: "job-materials-batch-note", children: getBatchDescription(materials.length) })] }));
}
