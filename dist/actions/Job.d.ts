export function saveJob(dispatch: any, project: any, omitRedirect?: boolean): {
    type: string;
    dispatch: any;
    omitRedirect: boolean;
    project: any;
};
export function submitJob(dispatch: any): {
    type: string;
    dispatch: any;
};
export function terminateJob(dispatch: any): {
    type: string;
    dispatch: any;
};
export function updateJob(job: any, metaProperties?: any[]): {
    type: string;
    job: any;
    metaProperties: any[];
};
export function syncJobWorkflow(job: any, workflowContexts: any, isMultiMaterial: any, metaProperties?: any[]): {
    type: string;
    job: any;
    workflowContexts: any;
    isMultiMaterial: any;
    metaProperties: any[];
};
export function setJobMultiMaterial(isMultiMaterial: any): {
    type: string;
    isMultiMaterial: any;
};
export const JOB_SAVE: "JOB_SAVE";
export const JOB_UPDATE: "JOB_UPDATE";
export const JOB_WORKFLOW_SYNC: "JOB_WORKFLOW_SYNC";
export const JOB_SUBMIT: "JOB_SUBMIT";
export const JOB_TERMINATE: "JOB_TERMINATE";
export const JOB_IS_MULTI_MATERIAL_SET: "JOB_IS_MULTI_MATERIAL_SET";
//# sourceMappingURL=Job.d.ts.map