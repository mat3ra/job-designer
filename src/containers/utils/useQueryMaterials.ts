import { useMemo } from "react";

import { useJobDesignerDeps } from "../../JobDesignerContext";

function sortMaterialsByQueryIds(materials: any[], queryMaterialIds: string[]) {
    return [...materials].sort(
        (a, b) =>
            queryMaterialIds.findIndex((id) => id === a.id) -
            queryMaterialIds.findIndex((id) => id === b.id),
    );
}

export default function useQueryMaterials(
    queryMaterialIds?: string[],
    listId = "JobDesignerMaterialsList", // old JobDesignerSelectedMaterialsList subscription
) {
    const { useProfile, useFetchMaterialsList } = useJobDesignerDeps();
    const profile = useProfile();
    const params = queryMaterialIds?.length
        ? {
              id: queryMaterialIds,
              ownerAccountSlug: profile.account?.entity?.slug,
              globalSearch: true,
          }
        : undefined;

    const queryMaterialsState = useFetchMaterialsList(listId, params);
    const queryMaterialIdsKey = queryMaterialIds?.join(",") ?? "";

    // TODO: what if materials array contains sets?
    const materials = useMemo(() => {
        const entities =
            queryMaterialsState?.list
                .map(({ entity }: any) => entity)
                ?.filter((entity: any) => !entity.isEntitySet) || [];

        if (!queryMaterialIds?.length) {
            return entities;
        }

        return sortMaterialsByQueryIds(entities, queryMaterialIds);
        // queryMaterialIdsKey is derived from queryMaterialIds; join is enough for cache stability.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryMaterialsState?.list, queryMaterialIdsKey]);

    const loading = Boolean(
        queryMaterialIds?.length && (!queryMaterialsState || queryMaterialsState.loading !== false),
    );

    return { materials, loading };
}
