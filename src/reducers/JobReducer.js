import { showErrorAlert } from "@exabyte-io/cove.js/dist/other/alerts";

import { renderConfigsFromJobMaterialsWorkflows, setJobNameBasedOnMaterials } from "@mat3ra/jode";
import {
    JOB_IS_MULTI_MATERIAL_SET,
    JOB_SAVE,
    JOB_SUBMIT,
    JOB_TERMINATE,
    JOB_UPDATE,
    JOB_WORKFLOW_SYNC,
} from "../actions";
import { renderJobForDesignerState } from "./renderJobForDesignerState";
import { reducerDeps } from "./reducerDeps";

function jobUpdate(state, action) {
    const job = renderJobForDesignerState(state, action.job, action.metaProperties ?? []);

    return {
        ...state,
        job,
        renderGeneration: (state.renderGeneration || 0) + 1,
    };
}

function jobWorkflowSync(state, action) {
    const job = renderJobForDesignerState(state, action.job, action.metaProperties ?? []);

    return {
        ...state,
        job,
        workflowContexts: action.workflowContexts,
        isMultiMaterial: action.isMultiMaterial,
        renderGeneration: (state.renderGeneration || 0) + 1,
    };
}

// NOTE: not currently used through Reducer, used directly instead
export function jobSetMaterial(state, action) {
    const { job } = state; // NOTE: does not mutate the job

    job.setMaterial(action.material);

    return { ...state, job };
}

function jobSave(state, action) {
    const { job, materials: stateMaterials } = state;

    const user = reducerDeps.accountsSelector.currentUser();
    let materials = stateMaterials;
    if (materials.length === 0 && job.materials?.length) {
        materials = job.materials;
    }
    const isMultiMaterial = Boolean(job.workflow?.isMultiMaterial ?? state.isMultiMaterial);

    const configs = renderConfigsFromJobMaterialsWorkflows({
        job,
        materials,
        materialsSet: state.materialsSet,
        isMultiMaterial,
        dataSet: state.dataset,
        workflowContexts: state.workflowContexts,
    }).map((c) => {
        return {
            ...c,
            creator: user.getAsEntityReference(),
        };
    });

    reducerDeps
        .createOrUpdate(configs)
        .then(() => {
            const { project } = action;
            if (action.omitRedirect !== true)
                reducerDeps.router.go(
                    "projectsEditOrView",
                    {
                        accountSlug: project.owner.slug,
                        projectSlug: project.slug,
                    },
                    {
                        query: reducerDeps.getRouteQueryParametersFromInSet(job.inSet),
                    },
                );
            action.dispatch(reducerDeps.setIsLoading(false));
        })
        .catch((err) => {
            action.dispatch(reducerDeps.setIsLoading(false));
            console.log("Error saving job", err);
            showErrorAlert(err.message);
        });

    return { ...state, isLoading: true };
}

function jobSubmit(state, action) {
    reducerDeps
        .submitJobAPI({ ids: [state.job.id] })
        .then(() => {
            action.dispatch(reducerDeps.setIsLoading(false));
        })
        .catch((err) => {
            showErrorAlert(err.message);
        });

    return { ...state, isLoading: true };
}

function jobTerminate(state, action) {
    reducerDeps
        .terminateJobAPI({ ids: [state.job.id] })
        .then(() => {
            action.dispatch(reducerDeps.setIsLoading(false));
        })
        .catch((err) => {
            showErrorAlert(err.message);
        });

    return { ...state, isLoading: true };
}

function jobSetIsMultiMaterial(state, action) {
    // job.name is dependent on multiMaterial property of workflow
    const { job, materials } = state;
    setJobNameBasedOnMaterials(job, materials);
    return { ...state, job, isMultiMaterial: action.isMultiMaterial };
}

export default {
    [JOB_SAVE]: jobSave,
    [JOB_TERMINATE]: jobTerminate,
    [JOB_SUBMIT]: jobSubmit,
    [JOB_UPDATE]: jobUpdate,
    [JOB_WORKFLOW_SYNC]: jobWorkflowSync,
    [JOB_IS_MULTI_MATERIAL_SET]: jobSetIsMultiMaterial,
};
