import { deepClone } from "@mat3ra/code/dist/js/utils";
import type { EntityReference, Job, JobEntity } from "@mat3ra/jode";
import { defaultDataset } from "@mat3ra/jode";
import type { MetaPropertyHolder } from "@mat3ra/prode";
import type { OrderedMaterial } from "@mat3ra/wode";
import path from "path";

import type { DatasetConfig } from "../components/DatasetTab";
import { renderJobForDesignerState } from "./renderJobForDesignerState";

/** The shape job-designer writes to `job.dataset` — esse models the field itself as `{}`. */
export interface JobDataset {
    objectStorageContainerData: DatasetConfig;
    datasetBasename: string;
    datasetFilepath: string;
}

/**
 * jode's own `JobSchemaMixin.d.ts` has no `dataset` accessor - a type-generation gap, not a
 * runtime one: the compiled `JobSchemaMixin.js` does define a real `get`/`set dataset()` pair
 * that routes through `_json` (so it does survive `toJSON()`/`clone()`). This augmentation just
 * lets TS see what the class already does at runtime.
 */
declare module "@mat3ra/jode" {
    // `S` must match Job's own type parameter list for this declaration merge to apply.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Job<S extends JobEntity = JobEntity> {
        dataset?: JobDataset;
    }
}

export interface JobDesignerState {
    /** Active material index, shared by `materials` and `workflowContexts`. */
    index: number;
    /**
     * NOTE: this can go stale — `applyMaterialSwitch` updates `index` but not `material`,
     * matching the pre-refactor reducer exactly. Consumers should prefer `materials[index]`
     * (which is what the old `mapStateToProps` passed down, and what `useJobDesignerState`
     * derives).
     */
    material: OrderedMaterial | undefined;
    materials: OrderedMaterial[];
    materialsSet?: EntityReference;
    job: Job;
    /** Deliberately `boolean | undefined`: wode's `Workflow.isMultiMaterial` is `undefined`
     *  (not `false`) for a default workflow, and tests assert strict equality against it. */
    isMultiMaterial: boolean | undefined;
    workflowContexts: Record<string, unknown>[];
    datasetConfig: DatasetConfig;
    /** Bumped to force a re-render: `job` is mutated in place, so its identity never changes. */
    renderGeneration: number;
}

export function initialJobDesignerState(
    job: Job,
    materials: OrderedMaterial[] = [],
    metaProperties: MetaPropertyHolder[] = [],
): JobDesignerState {
    const datasetConfig =
        job.dataset?.objectStorageContainerData ??
        // jode's own default uses legacy uppercase keys (CONTAINER/NAME/...) that predate the
        // lowercase `DatasetConfig` contract `DatasetTab` actually reads; kept only as a
        // placeholder value until a real dataset is picked.
        (defaultDataset.objectStorageContainerData as unknown as DatasetConfig);

    job.workflowInstance?.updateMethodData(materials, metaProperties);

    const materialForRender = materials[0];
    if (materialForRender && job.workflowInstance) {
        job.setMaterials(materials);
        job.setMaterial(materialForRender);
    }

    return {
        index: 0,
        material: materials[0],
        materials,
        materialsSet: job.materialsSet,
        job,
        // Preserved verbatim rather than coerced with Boolean(): `Workflow.isMultiMaterial` is
        // `undefined` for a default workflow, and coercing it to `false` breaks strict-equality
        // assertions against the workflow's own value.
        isMultiMaterial: job.workflowInstance?.isMultiMaterial,
        workflowContexts: materials.map(() => ({})),
        datasetConfig,
        renderGeneration: 0,
    };
}

/**
 * Core of the old `MaterialReducer.materialsSet`, shared by `applyMaterialsSet`,
 * `applyMaterialsAdd` and `applyMaterialsRemove` below: `index` and `workflowContexts` are passed
 * in and returned explicitly instead of being mutated on `state` before the spread picks them up.
 * The mutating form worked under Redux + `connect` but silently drops updates under React state,
 * which compares the returned object against the previous one.
 */
function applyMaterials(
    state: JobDesignerState,
    materials: OrderedMaterial[],
    materialsSet: EntityReference | undefined,
    metaProperties: MetaPropertyHolder[],
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
        job.setNameBasedOnMaterials(materials);
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

export function applyJobUpdate(
    state: JobDesignerState,
    job: Job,
    metaProperties: MetaPropertyHolder[] = [],
) {
    const nextJob = renderJobForDesignerState(state, job, metaProperties);
    return { ...state, job: nextJob, renderGeneration: (state.renderGeneration || 0) + 1 };
}

export function applyJobWorkflowSync(
    state: JobDesignerState,
    job: Job,
    workflowContexts: Record<string, unknown>[],
    isMultiMaterial: boolean,
    metaProperties: MetaPropertyHolder[] = [],
) {
    const nextJob = renderJobForDesignerState(state, job, metaProperties);
    return {
        ...state,
        job: nextJob,
        workflowContexts,
        isMultiMaterial,
        renderGeneration: (state.renderGeneration || 0) + 1,
    };
}

export function applyJobMultiMaterialSet(state: JobDesignerState, isMultiMaterial: boolean) {
    // job.name is dependent on the multiMaterial property of the workflow
    const { job, materials } = state;
    job.setNameBasedOnMaterials(materials);
    return { ...state, job, isMultiMaterial };
}

export function applyMaterialsSet(
    state: JobDesignerState,
    materials: OrderedMaterial[],
    materialsSet: EntityReference | undefined,
    metaProperties: MetaPropertyHolder[] = [],
) {
    const nextMaterials = [...materials];
    // Reset workflowContexts as new materials are selected; the current context is reused for
    // all of them.
    const workflowContexts = nextMaterials.map(() =>
        deepClone(state.workflowContexts[state.index] || {}),
    );
    return applyMaterials(state, nextMaterials, materialsSet, metaProperties, workflowContexts, 0);
}

export function applyMaterialsAdd(
    state: JobDesignerState,
    materials: OrderedMaterial[],
    metaProperties: MetaPropertyHolder[] = [],
) {
    const nextMaterials = [...state.materials, ...materials];
    // Extend workflowContexts for newly added materials, each starting from the currently active
    // material's context.
    const workflowContexts = [
        ...state.workflowContexts,
        ...materials.map(() => deepClone(state.workflowContexts[state.index] || {})),
    ];
    return applyMaterials(
        state,
        nextMaterials,
        state.materialsSet,
        metaProperties,
        workflowContexts,
        state.index,
    );
}

export function applyMaterialsRemove(
    state: JobDesignerState,
    indices?: number[],
    metaProperties: MetaPropertyHolder[] = [],
) {
    if (state.materials.length <= 1) return state;

    const materials = [...state.materials];
    const workflowContexts = [...state.workflowContexts];
    // No indices passed => remove the material at the current index.
    const rawIndices = indices?.length ? indices : [state.index];
    // Sort ascending; splices shift later positions, compensated by `- position` below.
    const sortedIndices = [...rawIndices].sort((a, b) => a - b);

    sortedIndices.forEach((index, position) => {
        materials.splice(index - position, 1);
        workflowContexts.splice(index - position, 1);
    });

    // Keep the viewer on a valid material: stay at the same position (which now holds the next
    // material), stepping back only when the removed one was last.
    const index = Math.min(state.index, materials.length - 1);

    return applyMaterials(
        state,
        materials,
        state.materialsSet,
        metaProperties,
        workflowContexts,
        index,
    );
}

export function applyMaterialSwitch(state: JobDesignerState, index: number) {
    // Mirrors the old `materialSwitch` -> `jobSetMaterial` pair: sets the active index and pushes
    // that material onto the job. Note it deliberately does NOT refresh `state.material` — see
    // the note on that field.
    const { job } = state;
    job.setMaterial(state.materials[index]);
    return { ...state, index, job };
}

export function applyDatasetUpdate(state: JobDesignerState, datasetConfig: DatasetConfig) {
    const DEFAULT_FILES_PREFIX = "/dropbox";
    const key = datasetConfig.key ?? "";
    // Remove the user slug from the filepath (e.g. "foo/bar.csv" => "bar.csv")
    const filepath = path.join(DEFAULT_FILES_PREFIX, key);
    const basenameArray = key.split("/");
    const basename = basenameArray.slice(1, basenameArray.length).join("/");

    const { job } = state;
    const dataset: JobDataset = {
        objectStorageContainerData: datasetConfig,
        datasetBasename: basename,
        datasetFilepath: filepath,
    };
    job.dataset = dataset;

    return { ...state, datasetConfig, job };
}
