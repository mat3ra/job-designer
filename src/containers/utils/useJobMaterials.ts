import { useMemo } from "react";

import { useJobDesignerDeps } from "../../JobDesignerContext";

export default function useJobMaterials(job?: any, defaultMaterial?: any) {
    const hasClientMaterials = Boolean(job?.materials);
    const materialId = job?._material?._id;

    // Memoize materialIds to prevent unnecessary array creation
    const materialIds = useMemo(() => job?._materials?.map((m) => m._id) || [], [job?._materials]);

    const materialsListFilter = useMemo(() => {
        if (hasClientMaterials) {
            return undefined;
        }
        if (materialIds.length) {
            return {
                id: materialIds,
                globalSearch: true,
            };
        }
        if (materialId) {
            return {
                id: materialId,
                globalSearch: true,
            };
        }
        return undefined;
    }, [hasClientMaterials, materialId, materialIds]);

    const { useFetchMaterialsList } = useJobDesignerDeps();
    const materials = useFetchMaterialsList(`job_${job?.slug}_materials`, materialsListFilter);

    if (!materialsListFilter && job?.materials?.length) {
        return job.materials;
    }

    if (!materialsListFilter && job?.material) {
        return [job?.material];
    }

    if (!materialsListFilter && defaultMaterial) {
        return [defaultMaterial];
    }

    if (materials?.loading === false && materials?.list.length === 0) {
        throw new Error("The requested job materials are not accessible");
    }

    if (materialsListFilter && job?._materials) {
        const materialIds = job._materials?.map((m) => m._id);
        const entities = materials?.list.map((m) => m.entity) || [];

        return entities.sort((a, b) => {
            return (
                materialIds.findIndex((id) => id === a.id) -
                materialIds.findIndex((id) => id === b.id)
            );
        });
    }

    return materials?.list.map((m) => m.entity) || [];
}
