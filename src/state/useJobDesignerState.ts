import { showErrorAlert } from "@mat3ra/cove/dist/other/alerts";
import type { EntityReference, Job } from "@mat3ra/jode";
import { renderConfigsFromJobMaterialsWorkflows } from "@mat3ra/jode";
import type { MetaPropertyHolder } from "@mat3ra/prode";
import type { OrderedMaterial } from "@mat3ra/wode";
import { useCallback, useMemo, useRef, useState } from "react";

import type { DatasetConfig } from "../components/DatasetTab";
import { asyncDeps } from "./asyncDeps";
import {
    applyDatasetUpdate,
    applyJobMultiMaterialSet,
    applyJobUpdate,
    applyJobWorkflowSync,
    applyMaterialsAdd,
    applyMaterialsRemove,
    applyMaterialsSet,
    applyMaterialSwitch,
    initialJobDesignerState,
} from "./jobDesignerState";

export interface UseJobDesignerStateArgs {
    job: Job;
    jobMaterials: OrderedMaterial[];
    metaProperties: MetaPropertyHolder[];
}

/**
 * Owns all job-designer state. Replaces the per-instance Redux store that used to be created in
 * `JobLocalReduxContainer` and read through a dedicated react-redux context.
 *
 * The interdependent cluster (job / materials / index / workflowContexts) lives in a single
 * `useState`, updated through the pure `applyXxx` helpers in `./jobDesignerState` (each mirrors
 * one case of the old reducer); `isLoading` is separate `useState` since only the async
 * operations below touch it.
 */
export default function useJobDesignerState({
    job,
    jobMaterials,
    metaProperties,
}: UseJobDesignerStateArgs) {
    // Lazy initializer, and intentionally NOT re-run when `job`/`jobMaterials` change: the old
    // store was likewise built once (`useMemo(..., [])`), with later changes arriving through the
    // setters below.
    const [state, setState] = useState(() =>
        initialJobDesignerState(job, jobMaterials, metaProperties),
    );
    const [isLoading, setIsLoading] = useState(false);

    const updateJob = useCallback(
        (nextJob: Job, nextMetaProperties?: MetaPropertyHolder[]) =>
            setState((prev) => applyJobUpdate(prev, nextJob, nextMetaProperties ?? [])),
        [],
    );

    const syncJobWorkflow = useCallback(
        (
            nextJob: Job,
            workflowContexts: Record<string, unknown>[],
            isMultiMaterial: boolean,
            nextMetaProperties?: MetaPropertyHolder[],
        ) =>
            setState((prev) =>
                applyJobWorkflowSync(
                    prev,
                    nextJob,
                    workflowContexts,
                    isMultiMaterial,
                    nextMetaProperties ?? [],
                ),
            ),
        [],
    );

    const setJobMultiMaterial = useCallback(
        (isMultiMaterial: boolean) =>
            setState((prev) => applyJobMultiMaterialSet(prev, isMultiMaterial)),
        [],
    );

    const setMaterials = useCallback(
        (
            materials: OrderedMaterial[],
            materialsSet?: EntityReference,
            nextMetaProperties?: MetaPropertyHolder[],
        ) =>
            setState((prev) =>
                applyMaterialsSet(prev, materials, materialsSet, nextMetaProperties ?? []),
            ),
        [],
    );

    const addMaterials = useCallback(
        (materials: OrderedMaterial[], nextMetaProperties?: MetaPropertyHolder[]) =>
            setState((prev) => applyMaterialsAdd(prev, materials, nextMetaProperties ?? [])),
        [],
    );

    const removeMaterials = useCallback(
        (indices: number[], nextMetaProperties?: MetaPropertyHolder[]) =>
            setState((prev) => applyMaterialsRemove(prev, indices, nextMetaProperties ?? [])),
        [],
    );

    const switchMaterialByIndex = useCallback(
        (index: number) => setState((prev) => applyMaterialSwitch(prev, index)),
        [],
    );

    const setDataset = useCallback(
        (datasetConfig: DatasetConfig) =>
            setState((prev) => applyDatasetUpdate(prev, datasetConfig)),
        [],
    );

    // ─── Async operations ─────────────────────────────────────────────────────────────
    // These were previously reducers that fired API calls, redirected and re-dispatched a
    // loading action from inside a promise. As plain callbacks they no longer make state updates
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
                // `inSet` isn't a `Job` field - jode's schema has no such property, and
                // pre-refactor this read was already always `undefined`. Left explicit rather
                // than silently dropped, since `redirectAfterSave` still declares the param.
                asyncDeps.redirectAfterSave({ project, inSet: undefined });
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
            // `id` is `string | undefined` on an unsaved job, but submit is only reachable once
            // the job has already been created and has a real `_id`.
            await asyncDeps.submitJobAPI({ ids: [stateRef.current.job.id as string] });
        } catch (err: any) {
            showErrorAlert(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const terminateJob = useCallback(async () => {
        setIsLoading(true);
        try {
            await asyncDeps.terminateJobAPI({ ids: [stateRef.current.job.id as string] });
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
