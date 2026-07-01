export function normalizeQueryMaterialIds(ids: unknown): string[] | undefined {
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

export function queryMaterialIdsCacheKey(ids: unknown): string {
    return normalizeQueryMaterialIds(ids)?.join(",") ?? "";
}
