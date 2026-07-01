import { deepClone } from "@mat3ra/code/dist/js/utils";
import { setJobNameBasedOnMaterials } from "@mat3ra/jode";
import {
    MATERIAL_SWITCH,
    MATERIALS_SET,
    MATERIALS_ADD,
    MATERIALS_REMOVE,
    MATERIALS_UPDATE_INDEX,
} from "../actions/Material";
import { jobSetMaterial } from "./JobReducer";
import { renderJobForDesignerState } from "./renderJobForDesignerState";

function materialsUpdateIndex(state, action) {
    return { ...state, index: action.index };
}

/**
 * @summary Sets materials + materials set for job designer:
 * - in case of multi-material job updates materials array of job
 * - otherwise generates corresponding workflows array for state.workflows
 */
function materialsSet(state, action, materialsToRetain = [], resetWorkflowContexts = true) {
    const materials = [].concat(materialsToRetain);
    materials.push(...action.materials);

    // reset workflowContexts as new materials are selected. Current context is used for all new materials.
    if (resetWorkflowContexts) {
        state.workflowContexts = materials.map(() =>
            deepClone(state.workflowContexts[state.index] || {}),
        );
        state.index = 0;
    }

    const job = state.job.clone();

    job.workflow.updateMethodData(materials, action.metaProperties);
    job.setMaterialsSet(action.materialsSet);

    // Always update the job.materials array, even if the job is not multi-material.
    // Otherwise, the logic in Job{Global,Local}ReduxContainer will not work correctly
    // when both "material" and "materials" are present.
    job.setMaterials(materials);

    if (!job.workflow.isMultiMaterial) {
        job.setMaterial(materials[state.index]);
        setJobNameBasedOnMaterials(job, materials);
    }

    renderJobForDesignerState(
        { ...state, materials, materialsSet: action.materialsSet, index: state.index },
        job,
        action.metaProperties ?? [],
    );

    return {
        ...state,
        materials,
        material: materials[state.index],
        job,
        materialsSet: action.materialsSet,
        renderGeneration: (state.renderGeneration || 0) + 1,
    };
}

/**
 * @summary Adds materials to job designer's material set:
 */
function materialsAdd(state, action) {
    const materials = [].concat(state.materials);
    // extend workflowContexts for newly added materials with context equal to the current active material.
    action.materials.forEach(() =>
        state.workflowContexts.push(deepClone(state.workflowContexts[state.index] || {})),
    );
    return materialsSet(state, action, materials, false);
}

/**
 * @summary Removes material from materials set:
 */
function materialsRemove(state, action) {
    if (state.materials.length <= 1) return state;

    const materials = [].concat(state.materials);

    action.indices.forEach((index) => {
        materials.splice(index, 1);
        // remove contexts for deleted materials
        state.workflowContexts.splice(index, 1);
    });

    action.materials = materials;

    return materialsSet(
        state,
        action,
        [],
        { index: state.index >= materials.length ? state.index - 1 : state.index },
        false,
    );
}

/**
 * @summary Handles switching materials in unit input preview.
 */
function materialSwitch(state, action) {
    const { index } = action;
    const material = state.materials[index];
    return jobSetMaterial({ ...state, index: action.index }, { material });
}

export default {
    [MATERIALS_ADD]: materialsAdd,
    [MATERIALS_REMOVE]: materialsRemove,
    [MATERIALS_UPDATE_INDEX]: materialsUpdateIndex,
    [MATERIAL_SWITCH]: materialSwitch,
    [MATERIALS_SET]: materialsSet,
};
