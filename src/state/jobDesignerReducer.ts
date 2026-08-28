import { deepClone } from "@mat3ra/code/dist/js/utils";
import { defaultDataset, setJobNameBasedOnMaterials } from "@mat3ra/jode";
import path from "path";

import { renderJobForDesignerState } from "./renderJobForDesignerState";

export interface JobDesignerState {
    /** Active material index, shared by `materials` and `workflowContexts`. */
    index: number;
    /**
     * NOTE: this can go stale — `MATERIAL_SWITCH` updates `index` but not `material`, matching
     * the pre-refactor reducers exactly. Consumers should prefer `materials[index]` (which is
     * what the old `mapStateToProps` passed down, and what `useJobDesignerState` derives).
     */
    material: any;
    materials: any[];
    materialsSet?: any;
    job: any;
    /** Deliberately `boolean | undefined`: wode's `Workflow.isMultiMaterial` is `undefined`
     *  (not `false`) for a default workflow, and tests assert strict equality against it. */
    isMultiMaterial: boolean | undefined;
    workflowContexts: Record<string, unknown>[];
    datasetConfig: any;
    /** Bumped to force a re-render: `job` is mutated in place, so its identity never changes. */
    renderGeneration: number;
}

export type JobDesignerAction =
    | { type: "JOB_UPDATE"; job: any; metaProperties?: any[] }
    | {
          type: "JOB_WORKFLOW_SYNC";
          job: any;
          workflowContexts: Record<string, unknown>[];
          isMultiMaterial: boolean;
          metaProperties?: any[];
      }
    | { type: "JOB_IS_MULTI_MATERIAL_SET"; isMultiMaterial: boolean }
    | { type: "MATERIALS_SET"; materials: any[]; materialsSet?: any; metaProperties?: any[] }
    | { type: "MATERIALS_ADD"; materials: any[]; metaProperties?: any[] }
    | { type: "MATERIALS_REMOVE"; indices?: number[]; metaProperties?: any[] }
    | { type: "MATERIALS_UPDATE_INDEX"; index: number }
    | { type: "MATERIAL_SWITCH"; index: number }
    | { type: "DATASET_UPDATE"; datasetConfig: any };

export function initialJobDesignerState(
    job: any,
    materials: any[] = [],
    metaProperties: any[] = [],
): JobDesignerState {
    const datasetConfig =
        job && "dataset" in job && job.dataset && "objectStorageContainerData" in job.dataset
            ? job.dataset.objectStorageContainerData
            : defaultDataset.objectStorageContainerData;

    job?.workflowInstance?.updateMethodData(materials, metaProperties);

    const materialForRender = materials[0];
    if (materialForRender && job?.workflowInstance) {
        job.setMaterials(materials);
        job.setMaterial(materialForRender);
    }

    return {
        index: 0,
        material: materials[0],
        materials,
        materialsSet: job && job.materialsSet,
        job,
        // Preserved verbatim rather than coerced with Boolean(): `Workflow.isMultiMaterial` is
        // `undefined` for a default workflow, and coercing it to `false` breaks strict-equality
        // assertions against the workflow's own value.
        isMultiMaterial: job && job.workflowInstance?.isMultiMaterial,
        workflowContexts: materials.map(() => ({})),
        datasetConfig,
        renderGeneration: 0,
    };
}

/**
 * Core of the old `MaterialReducer.materialsSet`, with one deliberate difference: `index` and
 * `workflowContexts` are passed in and returned explicitly instead of being mutated on `state`
 * before the spread picks them up. The mutating form worked under Redux + `connect` but silently
 * drops updates under `useReducer`, which compares the returned object against the previous one.
 */
function applyMaterials(
    state: JobDesignerState,
    materials: any[],
    materialsSet: any,
    metaProperties: any[],
    workflowContexts: Record<string, unknown>[],
    index: number,
): JobDesignerState {
    const job = state.job.clone();

    job.workflowInstance.updateMethodData(materials, metaProperties);
    job.setMaterialsSet(materialsSet);

    // Always update the job.materials array, even if the job is not multi-material. Otherwise
    // the logic in Job{Global,Local}ReduxContainer will not work correctly when both "material"
    // and "materials" are present.
    job.setMaterials(materials);

    if (!job.workflowInstance.isMultiMaterial) {
        job.setMaterial(materials[index]);
        setJobNameBasedOnMaterials(job, materials);
    }

    renderJobForDesignerState({ ...state, materials, materialsSet, index }, job, metaProperties);

    return {
        ...state,
        materials,
        material: materials[index],
        job,
        materialsSet,
        workflowContexts,
        index,
        renderGeneration: (state.renderGeneration || 0) + 1,
    };
}

export function jobDesignerReducer(
    state: JobDesignerState,
    action: JobDesignerAction,
): JobDesignerState {
    switch (action.type) {
        case "JOB_UPDATE": {
            const job = renderJobForDesignerState(state, action.job, action.metaProperties ?? []);
            return { ...state, job, renderGeneration: (state.renderGeneration || 0) + 1 };
        }

        case "JOB_WORKFLOW_SYNC": {
            const job = renderJobForDesignerState(state, action.job, action.metaProperties ?? []);
            return {
                ...state,
                job,
                workflowContexts: action.workflowContexts,
                isMultiMaterial: action.isMultiMaterial,
                renderGeneration: (state.renderGeneration || 0) + 1,
            };
        }

        case "JOB_IS_MULTI_MATERIAL_SET": {
            // job.name is dependent on the multiMaterial property of the workflow
            const { job, materials } = state;
            setJobNameBasedOnMaterials(job, materials);
            return { ...state, job, isMultiMaterial: action.isMultiMaterial };
        }

        case "MATERIALS_SET": {
            const materials = [...action.materials];
            // Reset workflowContexts as new materials are selected; the current context is
            // reused for all of them.
            const workflowContexts = materials.map(() =>
                deepClone(state.workflowContexts[state.index] || {}),
            );
            return applyMaterials(
                state,
                materials,
                action.materialsSet,
                action.metaProperties ?? [],
                workflowContexts,
                0,
            );
        }

        case "MATERIALS_ADD": {
            const materials = [...state.materials, ...action.materials];
            // Extend workflowContexts for newly added materials, each starting from the
            // currently active material's context.
            const workflowContexts = [
                ...state.workflowContexts,
                ...action.materials.map(() => deepClone(state.workflowContexts[state.index] || {})),
            ];
            return applyMaterials(
                state,
                materials,
                state.materialsSet,
                action.metaProperties ?? [],
                workflowContexts,
                state.index,
            );
        }

        case "MATERIALS_REMOVE": {
            if (state.materials.length <= 1) return state;

            const materials = [...state.materials];
            const workflowContexts = [...state.workflowContexts];
            // No indices passed => remove the material at the current index.
            const rawIndices = action.indices?.length ? action.indices : [state.index];
            // Sort ascending; splices shift later positions, compensated by `- position` below.
            const indices = [...rawIndices].sort((a, b) => a - b);

            indices.forEach((index, position) => {
                materials.splice(index - position, 1);
                workflowContexts.splice(index - position, 1);
            });

            // Keep the viewer on a valid material: stay at the same position (which now holds
            // the next material), stepping back only when the removed one was last.
            const index = Math.min(state.index, materials.length - 1);

            return applyMaterials(
                state,
                materials,
                state.materialsSet,
                action.metaProperties ?? [],
                workflowContexts,
                index,
            );
        }

        case "MATERIALS_UPDATE_INDEX":
            return { ...state, index: action.index };

        case "MATERIAL_SWITCH": {
            // Mirrors the old `materialSwitch` -> `jobSetMaterial` pair: sets the active index
            // and pushes that material onto the job. Note it deliberately does NOT refresh
            // `state.material` — see the note on that field.
            const { job } = state;
            job.setMaterial(state.materials[action.index]);
            return { ...state, index: action.index, job };
        }

        case "DATASET_UPDATE": {
            const { datasetConfig } = action;
            const DEFAULT_FILES_PREFIX = "/dropbox";
            // Remove the user slug from the filepath (e.g. "foo/bar.csv" => "bar.csv")
            const filepath = path.join(DEFAULT_FILES_PREFIX, datasetConfig.key);
            const basenameArray = datasetConfig.key.split("/");
            const basename = basenameArray.slice(1, basenameArray.length).join("/");

            const { job } = state;
            job.dataset = {
                objectStorageContainerData: datasetConfig,
                datasetBasename: basename,
                datasetFilepath: filepath,
            };

            return { ...state, datasetConfig, job };
        }

        default:
            return state;
    }
}
