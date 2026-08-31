import { showErrorAlert } from "@mat3ra/cove/dist/other/alerts";
import { renderConfigsFromJobMaterialsWorkflows } from "@mat3ra/jode";
import { useCallback, useMemo, useReducer, useRef, useState } from "react";

import { asyncDeps } from "./asyncDeps";
import { initialJobDesignerState, jobDesignerReducer } from "./jobDesignerReducer";

export interface UseJobDesignerStateArgs {
    job: any;
    jobMaterials: any[];
    metaProperties: any[];
}

/**
 * Owns all job-designer state. Replaces the per-instance Redux store that used to be created in
 * `JobLocalReduxContainer` and read through a dedicated react-redux context.
 *
 * The interdependent cluster (job / materials / index / workflowContexts) goes through a single
 * `useReducer`, keeping the original reducer semantics; `isLoading` is plain `useState` since
 * only the async operations below touch it.
 */
export default function useJobDesignerState({
    job,
    jobMaterials,
    metaProperties,
}: UseJobDesignerStateArgs) {
    // Lazy initializer, and intentionally NOT re-run when `job`/`jobMaterials` change: the old
    // store was likewise built once (`useMemo(..., [])`), with later changes arriving as
    // dispatched actions from the container's effects.
    const [state, dispatch] = useReducer(jobDesignerReducer, undefined, () =>
        initialJobDesignerState(job, jobMaterials, metaProperties),
    );
    const [isLoading, setIsLoading] = useState(false);

    const updateJob = useCallback(
        (nextJob: any, nextMetaProperties?: any[]) =>
            dispatch({ type: "JOB_UPDATE", job: nextJob, metaProperties: nextMetaProperties }),
        [],
    );

    const syncJobWorkflow = useCallback(
        (
            nextJob: any,
            workflowContexts: Record<string, unknown>[],
            isMultiMaterial: boolean,
            nextMetaProperties?: any[],
        ) =>
            dispatch({
                type: "JOB_WORKFLOW_SYNC",
                job: nextJob,
                workflowContexts,
                isMultiMaterial,
                metaProperties: nextMetaProperties,
            }),
        [],
    );

    const setJobMultiMaterial = useCallback(
        (isMultiMaterial: boolean) =>
            dispatch({ type: "JOB_IS_MULTI_MATERIAL_SET", isMultiMaterial }),
        [],
    );

    const setMaterials = useCallback(
        (materials: any[], materialsSet?: any, nextMetaProperties?: any[]) =>
            dispatch({
                type: "MATERIALS_SET",
                materials,
                materialsSet,
                metaProperties: nextMetaProperties,
            }),
        [],
    );

    const addMaterials = useCallback(
        (materials: any[], nextMetaProperties?: any[]) =>
            dispatch({ type: "MATERIALS_ADD", materials, metaProperties: nextMetaProperties }),
        [],
    );

    const removeMaterials = useCallback(
        (indices: number[], nextMetaProperties?: any[]) =>
            dispatch({ type: "MATERIALS_REMOVE", indices, metaProperties: nextMetaProperties }),
        [],
    );

    const switchMaterialByIndex = useCallback(
        (index: number) => dispatch({ type: "MATERIAL_SWITCH", index }),
        [],
    );

    const setDataset = useCallback(
        (datasetConfig: any) => dispatch({ type: "DATASET_UPDATE", datasetConfig }),
        [],
    );

    // ─── Async operations ─────────────────────────────────────────────────────────────
    // These were previously reducers that fired API calls, redirected and re-dispatched a
    // loading action from inside a promise. As plain callbacks they no longer make the reducer
    // impure, and the loading flag is just component state.

    // The async operations must read state at call time rather than close over the render that
    // created them: `saveJob` is reached through cove's `ButtonMultiSelect`, which snapshots its
    // first `onClick` and never resyncs, so a captured value would persist the job as it was on
    // the very first render — silently reverting every later edit.
    const stateRef = useRef(state);
    stateRef.current = state;

    const saveJob = useCallback(async (project: any, omitRedirect?: boolean) => {
        const { current } = stateRef;
        const user = asyncDeps.accountsSelector.currentUser();

        let { materials } = current;
        if (materials.length === 0 && current.job.materials?.length) {
            materials = current.job.materials;
        }
        const isMultiMaterial = Boolean(
            current.job.workflowInstance?.isMultiMaterial ?? current.isMultiMaterial,
        );

        // NOTE: `dataSet` and `workflowContexts` used to be passed here and were silently
        // ignored - `renderConfigsFromJobMaterialsWorkflows` only reads job/materials/
        // materialsSet/isMultiMaterial. Dataset data reaches the saved job through
        // `job.dataset`, which is schema-backed and survives `toJSON()`.
        const configs = renderConfigsFromJobMaterialsWorkflows({
            job: current.job,
            materials,
            materialsSet: current.materialsSet,
            isMultiMaterial,
        }).map((c: any) => ({ ...c, creator: user.getAsEntityReference() }));

        const configsToUpdate = configs.filter((c: any) => c._id || c.id);
        const configsToCreate = configs.filter((c: any) => !c._id && !c.id);

        setIsLoading(true);
        try {
            await Promise.all([
                configsToCreate.length ? asyncDeps.createJobAPI(configsToCreate) : null,
                configsToUpdate.length ? asyncDeps.updateJobAPI(configsToUpdate) : null,
            ]);
            if (omitRedirect !== true) {
                asyncDeps.redirectAfterSave({ project, inSet: current.job.inSet });
            }
        } catch (err: any) {
            console.error("Error saving job", err);
            showErrorAlert(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const submitJob = useCallback(async () => {
        setIsLoading(true);
        try {
            await asyncDeps.submitJobAPI({ ids: [stateRef.current.job.id] });
        } catch (err: any) {
            showErrorAlert(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const terminateJob = useCallback(async () => {
        setIsLoading(true);
        try {
            await asyncDeps.terminateJobAPI({ ids: [stateRef.current.job.id] });
        } catch (err: any) {
            showErrorAlert(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return useMemo(
        () => ({
            ...state,
            // Always derived, never the possibly-stale `state.material` — this is exactly what
            // the old `mapStateToProps` passed down.
            currentMaterial: state.materials[state.index],
            isLoading,
            updateJob,
            syncJobWorkflow,
            setJobMultiMaterial,
            setMaterials,
            addMaterials,
            removeMaterials,
            switchMaterialByIndex,
            setDataset,
            saveJob,
            submitJob,
            terminateJob,
        }),
        [
            state,
            isLoading,
            updateJob,
            syncJobWorkflow,
            setJobMultiMaterial,
            setMaterials,
            addMaterials,
            removeMaterials,
            switchMaterialByIndex,
            setDataset,
            saveJob,
            submitJob,
            terminateJob,
        ],
    );
}
