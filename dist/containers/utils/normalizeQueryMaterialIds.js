export function normalizeQueryMaterialIds(ids) {
    if (!ids) {
        return undefined;
    }
    if (Array.isArray(ids)) {
        const normalized = ids.map(String).filter(Boolean);
        return normalized.length ? normalized : undefined;
    }
    if (typeof ids === "string") {
        return ids
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);
    }
    return undefined;
}
export function queryMaterialIdsCacheKey(ids) {
    var _a, _b;
    return (_b = (_a = normalizeQueryMaterialIds(ids)) === null || _a === void 0 ? void 0 : _a.join(",")) !== null && _b !== void 0 ? _b : "";
}
