import { useMemo } from "react";
import { useJobDesignerDeps } from "../../JobDesignerContext";
function sortMaterialsByQueryIds(materials, queryMaterialIds) {
    return [...materials].sort((a, b) => queryMaterialIds.findIndex((id) => id === a.id) -
        queryMaterialIds.findIndex((id) => id === b.id));
}
export default function useQueryMaterials(queryMaterialIds, listId = "JobDesignerMaterialsList") {
    var _a, _b, _c;
    const { useProfile, useFetchMaterialsList } = useJobDesignerDeps();
    const profile = useProfile();
    const params = (queryMaterialIds === null || queryMaterialIds === void 0 ? void 0 : queryMaterialIds.length)
        ? {
            id: queryMaterialIds,
            ownerAccountSlug: (_b = (_a = profile.account) === null || _a === void 0 ? void 0 : _a.entity) === null || _b === void 0 ? void 0 : _b.slug,
            globalSearch: true,
        }
        : undefined;
    const queryMaterialsState = useFetchMaterialsList(listId, params);
    const queryMaterialIdsKey = (_c = queryMaterialIds === null || queryMaterialIds === void 0 ? void 0 : queryMaterialIds.join(",")) !== null && _c !== void 0 ? _c : "";
    // TODO: what if materials array contains sets?
    const materials = useMemo(() => {
        var _a;
        const entities = ((_a = queryMaterialsState === null || queryMaterialsState === void 0 ? void 0 : queryMaterialsState.list.map(({ entity }) => entity)) === null || _a === void 0 ? void 0 : _a.filter((entity) => !entity.isEntitySet)) || [];
        if (!(queryMaterialIds === null || queryMaterialIds === void 0 ? void 0 : queryMaterialIds.length)) {
            return entities;
        }
        return sortMaterialsByQueryIds(entities, queryMaterialIds);
        // queryMaterialIdsKey is derived from queryMaterialIds; join is enough for cache stability.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryMaterialsState === null || queryMaterialsState === void 0 ? void 0 : queryMaterialsState.list, queryMaterialIdsKey]);
    const loading = Boolean((queryMaterialIds === null || queryMaterialIds === void 0 ? void 0 : queryMaterialIds.length) && (!queryMaterialsState || queryMaterialsState.loading !== false));
    return { materials, loading };
}
