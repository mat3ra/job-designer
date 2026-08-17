/**
 * The facts about a material worth putting next to the 3D viewer.
 *
 * The Materials tab is a full-bleed canvas today: it shows the structure and
 * nothing else, so the things a reader checks before running a job — what
 * formula this actually is, which lattice, how many atoms, where it came from —
 * are only available by leaving the designer.
 *
 * Deliberately defensive. `MaterialTab` already renders a fallback for hosts
 * that pass something other than a made `Material` (the standalone demo used
 * to), and model getters can throw on partial configs. A metadata panel that
 * takes the page down with it would be worse than no panel, so every field is
 * read through {@link readSafely} and simply omitted when unavailable.
 */
export interface MaterialSource {
    id: string;
    name?: string;
    url?: string;
}
export interface MaterialSummary {
    name?: string;
    /** Unit-cell formula where known ("Si2"), otherwise the reduced one ("Si"). */
    formula?: string;
    latticeType?: string;
    /** Pre-formatted lattice constants, e.g. "a = 3.867 Å" or "a 3.87 · b 3.87 · c 5.02 Å". */
    latticeParameters?: string;
    /** Pre-formatted angles, omitted when the cell is a right prism. */
    latticeAngles?: string;
    atomCount?: number;
    spaceGroup?: string;
    source?: MaterialSource;
}
export declare function getMaterialSummary(material: any): MaterialSummary;
/**
 * The consequence of a multi-material selection, stated rather than implied.
 * A materials set silently turns one job into N, which the designer never says.
 */
export declare function getBatchDescription(materialCount: number): string;
//# sourceMappingURL=materialSummary.d.ts.map