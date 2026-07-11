export const JOB_SAVE = "JOB_SAVE";
export const JOB_UPDATE = "JOB_UPDATE";
export const JOB_WORKFLOW_SYNC = "JOB_WORKFLOW_SYNC";
export const JOB_SUBMIT = "JOB_SUBMIT";
export const JOB_TERMINATE = "JOB_TERMINATE";
export const JOB_IS_MULTI_MATERIAL_SET = "JOB_IS_MULTI_MATERIAL_SET";
export function saveJob(dispatch, project, omitRedirect = false) {
    return {
        type: JOB_SAVE,
        dispatch,
        omitRedirect,
        project,
    };
}
export function submitJob(dispatch) {
    return {
        type: JOB_SUBMIT,
        dispatch,
    };
}
export function terminateJob(dispatch) {
    return {
        type: JOB_TERMINATE,
        dispatch,
    };
}
export function updateJob(job, metaProperties = []) {
    return {
        type: JOB_UPDATE,
        job,
        metaProperties,
    };
}
export function syncJobWorkflow(job, workflowContexts, isMultiMaterial, metaProperties = []) {
    return {
        type: JOB_WORKFLOW_SYNC,
        job,
        workflowContexts,
        isMultiMaterial,
        metaProperties,
    };
}
export function setJobMultiMaterial(isMultiMaterial) {
    return {
        type: JOB_IS_MULTI_MATERIAL_SET,
        isMultiMaterial,
    };
}
