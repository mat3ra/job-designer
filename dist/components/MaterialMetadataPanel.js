import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { getMaterialSummary } from "../materialSummary";
/** One fact. Rendered only when there is one — an empty row says nothing. */
function MetadataRow({ label, children }) {
    if (children === undefined || children === null || children === "")
        return null;
    return (_jsxs(Box, { sx: {
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: "1px solid",
            borderColor: "divider",
            "&:last-of-type": { borderBottom: "none" },
        }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", sx: { flexShrink: 0 }, children: label }), _jsx(Typography, { variant: "caption", sx: {
                    fontFamily: (theme) => { var _a; return (_a = theme.fonts) === null || _a === void 0 ? void 0 : _a.monospace; },
                    fontVariantNumeric: "tabular-nums",
                    textAlign: "right",
                    wordBreak: "break-word",
                }, children: children })] }));
}
/**
 * What the structure on screen actually is, beside the viewer.
 *
 * The Materials tab renders a 3D canvas and nothing else, so formula, lattice,
 * atom count and provenance — the things worth checking before spending
 * core-hours on a run — could only be found by leaving the designer.
 */
export default function MaterialMetadataPanel({ material }) {
    const summary = getMaterialSummary(material);
    // Nothing legible to report: better to show no panel than an empty frame.
    const hasAnything = Boolean(summary.formula || summary.latticeType || summary.atomCount || summary.source);
    if (!hasAnything)
        return null;
    return (_jsxs(Paper, { variant: "outlined", id: "job-material-metadata", sx: { overflow: "hidden" }, children: [_jsx(MetadataRow, { label: "Formula", children: summary.formula }), _jsx(MetadataRow, { label: "Lattice", children: summary.latticeType }), _jsx(MetadataRow, { label: "Parameters", children: summary.latticeParameters }), _jsx(MetadataRow, { label: "Angles", children: summary.latticeAngles }), _jsx(MetadataRow, { label: "Space group", children: summary.spaceGroup }), _jsx(MetadataRow, { label: "Atoms in cell", children: summary.atomCount }), _jsx(MetadataRow, { label: "Source", children: summary.source ? (summary.source.url ? (_jsx(Link, { href: summary.source.url, target: "_blank", rel: "noopener noreferrer", children: summary.source.id })) : (summary.source.id)) : undefined })] }));
}
