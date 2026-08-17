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
function readSafely(read) {
    try {
        return read();
    }
    catch (_a) {
        return undefined;
    }
}
const ANGSTROM = "Å";
const MIDDLE_DOT = "·";
/** Lattice constants agreeing to this many decimals are treated as one value. */
const LATTICE_EQUALITY_TOLERANCE = 1e-4;
function roundToDecimals(value, decimals = 3) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
function formatLatticeParameters(lattice) {
    const { a, b, c } = lattice !== null && lattice !== void 0 ? lattice : {};
    if (![a, b, c].every((value) => typeof value === "number" && Number.isFinite(value))) {
        return undefined;
    }
    const isCubicCell = Math.abs(a - b) < LATTICE_EQUALITY_TOLERANCE &&
        Math.abs(a - c) < LATTICE_EQUALITY_TOLERANCE;
    // Repeating one number three times says less than showing it once.
    if (isCubicCell)
        return `a = ${roundToDecimals(a)} ${ANGSTROM}`;
    return `a ${roundToDecimals(a)} ${MIDDLE_DOT} b ${roundToDecimals(b)} ${MIDDLE_DOT} c ${roundToDecimals(c)} ${ANGSTROM}`;
}
function formatLatticeAngles(lattice) {
    const { alpha, beta, gamma } = lattice !== null && lattice !== void 0 ? lattice : {};
    if (![alpha, beta, gamma].every((v) => typeof v === "number" && Number.isFinite(v))) {
        return undefined;
    }
    // 90/90/90 is the unremarkable case; saying so spends a row to say nothing.
    const isRightPrism = [alpha, beta, gamma].every((angle) => Math.abs(angle - 90) < LATTICE_EQUALITY_TOLERANCE);
    if (isRightPrism)
        return undefined;
    return `${roundToDecimals(alpha, 1)}° ${MIDDLE_DOT} ${roundToDecimals(beta, 1)}° ${MIDDLE_DOT} ${roundToDecimals(gamma, 1)}°`;
}
function getAtomCount(material) {
    const count = readSafely(() => { var _a, _b, _c, _d, _e; return (_c = (_b = (_a = material === null || material === void 0 ? void 0 : material.Basis) === null || _a === void 0 ? void 0 : _a.elements) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : (_e = (_d = material === null || material === void 0 ? void 0 : material.basis) === null || _d === void 0 ? void 0 : _d.elements) === null || _e === void 0 ? void 0 : _e.length; });
    return typeof count === "number" ? count : undefined;
}
function getSpaceGroup(material) {
    var _a, _b;
    const derivedProperties = (_a = readSafely(() => material === null || material === void 0 ? void 0 : material.derivedProperties)) !== null && _a !== void 0 ? _a : [];
    const symmetry = Array.isArray(derivedProperties)
        ? derivedProperties.find((property) => (property === null || property === void 0 ? void 0 : property.name) === "symmetry")
        : undefined;
    return (_b = symmetry === null || symmetry === void 0 ? void 0 : symmetry.spaceGroupSymbol) !== null && _b !== void 0 ? _b : undefined;
}
function getSource(material) {
    const external = readSafely(() => { var _a, _b; return (_a = material === null || material === void 0 ? void 0 : material.external) !== null && _a !== void 0 ? _a : (_b = material === null || material === void 0 ? void 0 : material._json) === null || _b === void 0 ? void 0 : _b.external; });
    if (!(external === null || external === void 0 ? void 0 : external.id))
        return undefined;
    return { id: String(external.id), name: external.source, url: external.url };
}
export function getMaterialSummary(material) {
    const lattice = readSafely(() => material === null || material === void 0 ? void 0 : material.lattice);
    return {
        name: readSafely(() => material === null || material === void 0 ? void 0 : material.name),
        formula: readSafely(() => material === null || material === void 0 ? void 0 : material.unitCellFormula) || readSafely(() => material === null || material === void 0 ? void 0 : material.formula),
        latticeType: readSafely(() => lattice === null || lattice === void 0 ? void 0 : lattice.type),
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
export function getBatchDescription(materialCount) {
    if (materialCount <= 1)
        return getMessage("materials.runsOnce");
    return getMessage("materials.runsPerMaterial", { count: materialCount });
}
