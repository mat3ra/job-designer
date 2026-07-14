export const MATERIAL_SWITCH = "MATERIAL_SWITCH";
export const MATERIALS_SET = "MATERIALS_SET";
export const MATERIALS_ADD = "MATERIALS_ADD";
export const MATERIALS_REMOVE = "MATERIALS_REMOVE";
export const MATERIALS_UPDATE_INDEX = "MATERIALS_UPDATE_INDEX";

export function setMaterials(materials, materialsSet, metaProperties) {
    return {
        type: MATERIALS_SET,
        materials,
        materialsSet,
        metaProperties,
    };
}

export function switchMaterialByIndex(index) {
    return {
        type: MATERIAL_SWITCH,
        index,
    };
}

export function materialsAdd(materials, metaProperties) {
    return {
        type: MATERIALS_ADD,
        materials,
        metaProperties,
    };
}

export function materialsRemove(indices, metaProperties) {
    return {
        type: MATERIALS_REMOVE,
        indices,
        metaProperties,
    };
}
