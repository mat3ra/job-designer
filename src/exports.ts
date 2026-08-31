export { default as JobContainer } from "./components/Job";
export { default as JobLocalReduxContainer } from "./containers/JobLocalReduxContainer";
// State layer (replaces the removed local Redux store). The reducer is exported standalone so
// it can be unit-tested without mounting a component.
export { default as useJobDesignerState } from "./state/useJobDesignerState";
export {
    initialJobDesignerState,
    jobDesignerReducer,
    type JobDesignerAction,
    type JobDesignerState,
} from "./state/jobDesignerReducer";
export { syncSubworkflowSchemaOnWorkflow } from "./syncSubworkflowSchemaOnWorkflow";
export { shouldPersistJobOnUpdate } from "./shouldPersistJobOnUpdate";
export {
    normalizeQueryMaterialIds,
    queryMaterialIdsCacheKey,
} from "./containers/utils/normalizeQueryMaterialIds";
export { default as useJobMaterials } from "./containers/utils/useJobMaterials";
export { default as useJobReduxDialogs } from "./containers/utils/useJobReduxDialogs";
export { default as useQueryMaterials } from "./containers/utils/useQueryMaterials";
export { default as DatasetTab } from "./components/DatasetTab";
export { default as SelectProjectModal } from "./components/SelectProjectModal";
export { JobDesignerProvider, useJobDesignerDeps } from "./JobDesignerContext";
// Imperative dep injection shim — used by webapp's registerDependencies.ts
export { setDependencies, getDependency } from "./setDependencies";
export type { JobDesignerDeps, JobDesignerDialogTuple } from "./JobDesignerContext";
export type { MaterialViewerComponentProps } from "./components/MaterialTab";
// web-app's imports/client/dialogTypes.ts already imports this from "@mat3ra/job-designer",
// but it was never re-exported here - the import was unresolvable through the public surface.
export type { SelectProjectModalProps } from "./components/SelectProjectModal";

// Re-export core job design elements from @mat3ra/jode for convenience
export {
    Job,
    JobStatus,
    JOB_STATUSES,
    JOB_FINAL_STATUS_LIST,
    JOB_STATUS_CLS,
    JOB_MODES,
    SINGLE_JOB_SUFFIX,
    TAB_NAVIGATION_CONFIG,
    defaultDataset,
    renderJinjaTemplate,
    renderConfigsFromJobMaterialsWorkflows,
    setJobNameBasedOnMaterials,
} from "@mat3ra/jode";
