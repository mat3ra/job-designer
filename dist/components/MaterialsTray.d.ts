import React from "react";
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
export default function MaterialsTray({ materials, activeIndex, onSelect, onRemove, onAdd, editable, }: MaterialsTrayProps): React.JSX.Element;
//# sourceMappingURL=MaterialsTray.d.ts.map