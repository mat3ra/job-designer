import { useMemo } from "react";
import { useJobDesignerDeps } from "../../JobDesignerContext";
export default function useJobMaterials(job, defaultMaterial) {
    var _a, _b, _c;
    const hasClientMaterials = Boolean(job === null || job === void 0 ? void 0 : job.materials);
    const materialId = (_a = job === null || job === void 0 ? void 0 : job._material) === null || _a === void 0 ? void 0 : _a._id;
    // Memoize materialIds to prevent unnecessary array creation
    const materialIds = useMemo(() => { var _a; return ((_a = job === null || job === void 0 ? void 0 : job._materials) === null || _a === void 0 ? void 0 : _a.map((m) => m._id)) || []; }, [job === null || job === void 0 ? void 0 : job._materials]);
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
    const materials = useFetchMaterialsList(`job_${job === null || job === void 0 ? void 0 : job.slug}_materials`, materialsListFilter);
    if (!materialsListFilter && ((_b = job === null || job === void 0 ? void 0 : job.materials) === null || _b === void 0 ? void 0 : _b.length)) {
        return job.materials;
    }
    if (!materialsListFilter && (job === null || job === void 0 ? void 0 : job.material)) {
        return [job === null || job === void 0 ? void 0 : job.material];
    }
    if (!materialsListFilter && defaultMaterial) {
        return [defaultMaterial];
    }
    if ((materials === null || materials === void 0 ? void 0 : materials.loading) === false && (materials === null || materials === void 0 ? void 0 : materials.list.length) === 0) {
        throw new Error("The requested job materials are not accessible");
    }
    if (materialsListFilter && (job === null || job === void 0 ? void 0 : job._materials)) {
        const materialIds = (_c = job._materials) === null || _c === void 0 ? void 0 : _c.map((m) => m._id);
        const entities = (materials === null || materials === void 0 ? void 0 : materials.list.map((m) => m.entity)) || [];
        return entities.sort((a, b) => {
            return (materialIds.findIndex((id) => id === a.id) -
                materialIds.findIndex((id) => id === b.id));
        });
    }
    return (materials === null || materials === void 0 ? void 0 : materials.list.map((m) => m.entity)) || [];
}
