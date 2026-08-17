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

import { getMessage } from "./messages";

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

function readSafely<T>(read: () => T | undefined): T | undefined {
    try {
        return read();
    } catch {
        return undefined;
    }
}

const ANGSTROM = "Å";
const MIDDLE_DOT = "·";
/** Lattice constants agreeing to this many decimals are treated as one value. */
const LATTICE_EQUALITY_TOLERANCE = 1e-4;

function roundToDecimals(value: number, decimals = 3): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function formatLatticeParameters(lattice: any): string | undefined {
    const { a, b, c } = lattice ?? {};
    if (![a, b, c].every((value) => typeof value === "number" && Number.isFinite(value))) {
        return undefined;
    }

    const isCubicCell =
        Math.abs(a - b) < LATTICE_EQUALITY_TOLERANCE &&
        Math.abs(a - c) < LATTICE_EQUALITY_TOLERANCE;

    // Repeating one number three times says less than showing it once.
    if (isCubicCell) return `a = ${roundToDecimals(a)} ${ANGSTROM}`;

    return `a ${roundToDecimals(a)} ${MIDDLE_DOT} b ${roundToDecimals(
        b,
    )} ${MIDDLE_DOT} c ${roundToDecimals(c)} ${ANGSTROM}`;
}

function formatLatticeAngles(lattice: any): string | undefined {
    const { alpha, beta, gamma } = lattice ?? {};
    if (![alpha, beta, gamma].every((v) => typeof v === "number" && Number.isFinite(v))) {
        return undefined;
    }

    // 90/90/90 is the unremarkable case; saying so spends a row to say nothing.
    const isRightPrism = [alpha, beta, gamma].every(
        (angle) => Math.abs(angle - 90) < LATTICE_EQUALITY_TOLERANCE,
    );
    if (isRightPrism) return undefined;

    return `${roundToDecimals(alpha, 1)}° ${MIDDLE_DOT} ${roundToDecimals(
        beta,
        1,
    )}° ${MIDDLE_DOT} ${roundToDecimals(gamma, 1)}°`;
}

function getAtomCount(material: any): number | undefined {
    const count = readSafely(
        () => material?.Basis?.elements?.length ?? material?.basis?.elements?.length,
    );

    return typeof count === "number" ? count : undefined;
}

function getSpaceGroup(material: any): string | undefined {
    const derivedProperties = readSafely(() => material?.derivedProperties) ?? [];
    const symmetry = Array.isArray(derivedProperties)
        ? derivedProperties.find((property: any) => property?.name === "symmetry")
        : undefined;

    return symmetry?.spaceGroupSymbol ?? undefined;
}

function getSource(material: any): MaterialSource | undefined {
    const external = readSafely(() => material?.external ?? material?._json?.external);
    if (!external?.id) return undefined;

    return { id: String(external.id), name: external.source, url: external.url };
}

export function getMaterialSummary(material: any): MaterialSummary {
    const lattice = readSafely(() => material?.lattice);

    return {
        name: readSafely(() => material?.name),
        formula: readSafely(() => material?.unitCellFormula) || readSafely(() => material?.formula),
        latticeType: readSafely(() => lattice?.type),
        latticeParameters: formatLatticeParameters(lattice),
        latticeAngles: formatLatticeAngles(lattice),
        atomCount: getAtomCount(material),
        spaceGroup: getSpaceGroup(material),
        source: getSource(material),
    };
}

/**
 * The consequence of a multi-material selection, stated rather than implied.
 * A materials set silently turns one job into N, which the designer never says.
 */
export function getBatchDescription(materialCount: number): string {
    if (materialCount <= 1) return getMessage("materials.runsOnce");

    return getMessage("materials.runsPerMaterial", { count: materialCount });
}
