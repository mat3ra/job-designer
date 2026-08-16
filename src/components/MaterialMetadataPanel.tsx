import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import React from "react";

import { getMaterialSummary } from "../materialSummary";

/** One fact. Rendered only when there is one — an empty row says nothing. */
function MetadataRow({ label, children }: { label: string; children?: React.ReactNode }) {
    if (children === undefined || children === null || children === "") return null;

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                px: 2,
                py: 1.25,
                borderBottom: "1px solid",
                borderColor: "divider",
                "&:last-of-type": { borderBottom: "none" },
            }}
        >
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                {label}
            </Typography>
            <Typography
                variant="caption"
                sx={{
                    fontFamily: (theme) => (theme as any).fonts?.monospace,
                    fontVariantNumeric: "tabular-nums",
                    textAlign: "right",
                    wordBreak: "break-word",
                }}
            >
                {children}
            </Typography>
        </Box>
    );
}

/**
 * What the structure on screen actually is, beside the viewer.
 *
 * The Materials tab renders a 3D canvas and nothing else, so formula, lattice,
 * atom count and provenance — the things worth checking before spending
 * core-hours on a run — could only be found by leaving the designer.
 */
/** The source id, linked out when the model knows where it came from. */
function SourceValue({ source }: { source?: { id: string; url?: string } }) {
    if (!source) return null;
    if (!source.url) return <span>{source.id}</span>;

    return (
        <Link href={source.url} target="_blank" rel="noopener noreferrer">
            {source.id}
        </Link>
    );
}

export default function MaterialMetadataPanel({ material }: { material: any }) {
    const summary = getMaterialSummary(material);

    // Nothing legible to report: better to show no panel than an empty frame.
    const hasAnything = Boolean(
        summary.formula || summary.latticeType || summary.atomCount || summary.source,
    );
    if (!hasAnything) return null;

    return (
        <Paper variant="outlined" id="job-material-metadata" sx={{ overflow: "hidden" }}>
            <MetadataRow label="Formula">{summary.formula}</MetadataRow>
            <MetadataRow label="Lattice">{summary.latticeType}</MetadataRow>
            <MetadataRow label="Parameters">{summary.latticeParameters}</MetadataRow>
            <MetadataRow label="Angles">{summary.latticeAngles}</MetadataRow>
            <MetadataRow label="Space group">{summary.spaceGroup}</MetadataRow>
            <MetadataRow label="Atoms in cell">{summary.atomCount}</MetadataRow>
            <MetadataRow label="Source">
                {summary.source ? <SourceValue source={summary.source} /> : undefined}
            </MetadataRow>
        </Paper>
    );
}
