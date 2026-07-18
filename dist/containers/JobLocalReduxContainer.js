import { jsx as _jsx } from "react/jsx-runtime";
import { setJobNameBasedOnMaterials } from "@mat3ra/jode";
import { memo, useCallback, useEffect, useMemo } from "react";
import { Provider } from "react-redux";
import { applyMiddleware, createStore } from "redux";
import logger from "redux-logger";
import { setMaterials, syncJobWorkflow, updateJob } from "../actions";
import { useJobDesignerDeps } from "../JobDesignerContext";
import { createJobDesignerReducer } from "../reducers";
import JobContainer from "./JobContainer";
import { JobDesignerReduxContext, useJobDesignerDispatch, useJobDesignerSelector, } from "./JobDesignerReduxContext";
function JobStoreLocalReduxContainer({ jobId, workflowId, materials, job, project, publicAccount, metaProperties, accountUsers, accountUsersIsLoading, profile, clusters, refreshMetaProperties, jobDialogs, workflowDialogs, templates, resultsProperties, jobProperties, createMetaProperty, fetchMaterials, loadWorkflowEntityById, onMaterialAdd, onMaterialRemove, onDestroy, getJobMaterialClient, MaterialViewerComponent, headerChildren, editable, }) {
    const dispatch = useJobDesignerDispatch();
    const stateMaterials = useJobDesignerSelector((state) => state.materials);
    const stateMaterial = useJobDesignerSelector((state) => state.material);
    const stateJob = useJobDesignerSelector((state) => state.job);
    const stateWorkflowContexts = useJobDesignerSelector((state) => state.workflowContexts);
    const stateIndex = useJobDesignerSelector((state) => state.index);
    const stateMaterialsSet = useJobDesignerSelector((state) => state.materialsSet);
    const { getRouteQueryTab } = useJobDesignerDeps();
    const syncWorkflowWithJob = useCallback((nextWorkflow) => {
        const nextJob = stateJob.clone();
        const nextContexts = [...(stateWorkflowContexts || [])];
        const materialForRender = stateMaterials[stateIndex] || stateMaterial;
        nextWorkflow.updateMethodData(stateMaterials, metaProperties);
        nextJob.setWorkflow(nextWorkflow);
        if (materialForRender) {
            if (stateMaterial) {
                nextJob.setMaterial(stateMaterial);
            }
            if (stateMaterials.length) {
                nextJob.setMaterials(stateMaterials);
            }
            if (stateMaterialsSet) {
                nextJob.setMaterialsSet(stateMaterialsSet);
            }
        }
        nextContexts[stateIndex] = nextContexts[stateIndex] || {};
        dispatch(syncJobWorkflow(nextJob, nextContexts, Boolean(nextWorkflow.isMultiMaterial), metaProperties));
    }, [
        dispatch,
        metaProperties,
        stateIndex,
        stateJob,
        stateMaterial,
        stateMaterials,
        stateMaterialsSet,
        stateWorkflowContexts,
    ]);
    const handleWorkflowSelect = useCallback(async (workflowId) => {
        const nextWorkflow = await loadWorkflowEntityById(workflowId);
        if (!nextWorkflow) {
            return;
        }
        const nextJob = stateJob.clone();
        const nextContexts = [...(stateWorkflowContexts || [])];
        nextWorkflow.updateMethodData(stateMaterials, metaProperties);
        nextJob.setWorkflow(nextWorkflow);
        nextJob.setMaterial(stateMaterial);
        nextJob.setMaterials(stateMaterials);
        nextJob.setMaterialsSet(stateMaterialsSet);
        setJobNameBasedOnMaterials(nextJob, stateMaterials);
        nextContexts[stateIndex] = nextContexts[stateIndex] || {};
        dispatch(syncJobWorkflow(nextJob, nextContexts, Boolean(nextWorkflow.isMultiMaterial), metaProperties));
    }, [
        dispatch,
        loadWorkflowEntityById,
        metaProperties,
        stateIndex,
        stateJob,
        stateMaterial,
        stateMaterials,
        stateMaterialsSet,
        stateWorkflowContexts,
    ]);
    useEffect(() => {
        if (!jobId)
            return;
        dispatch(updateJob(job));
    }, [job, jobId, dispatch]);
    useEffect(() => {
        var _a;
        // Sync URL/query materials when opening an existing job before the user picks materials.
        // Create mode initializes materials from the local store; query ids are resolved upstream.
        // Do not pass materialsSet: undefined — that would drop ordered-set ordering for NEB images.
        if (!jobId || stateMaterials.length > 0 || !(materials === null || materials === void 0 ? void 0 : materials.length)) {
            return;
        }
        dispatch(setMaterials(materials, (_a = job.materialsSet) !== null && _a !== void 0 ? _a : stateMaterialsSet, metaProperties));
    }, [
        jobId,
        job.materialsSet,
        materials,
        metaProperties,
        dispatch,
        stateMaterials.length,
        stateMaterialsSet,
    ]);
    useEffect(() => {
        if (stateMaterials.length) {
            const elementsArrays = stateMaterials
                .filter((material) => material)
                .map((material) => material.uniqueElements);
            const newElements = Array.from(new Set(elementsArrays.flat()));
            refreshMetaProperties(newElements);
        }
        else if (stateMaterial) {
            const newElements = stateMaterial.uniqueElements;
            refreshMetaProperties(newElements);
        }
    }, [stateMaterials, stateMaterial, dispatch, refreshMetaProperties]);
    useEffect(() => {
        if (!workflowId || jobId)
            return;
        handleWorkflowSelect(workflowId).catch(console.error);
    }, [jobId, workflowId]);
    return (_jsx(JobContainer, { project: project, publicAccount: publicAccount, metaProperties: metaProperties, accountUsers: accountUsers, accountUsersIsLoading: accountUsersIsLoading, profile: profile, clusters: clusters, jobDialogs: jobDialogs, workflowDialogs: workflowDialogs, templates: templates, resultsProperties: resultsProperties, jobProperties: jobProperties, createMetaProperty: createMetaProperty, fetchMaterials: fetchMaterials, onMaterialAdd: onMaterialAdd, onMaterialRemove: onMaterialRemove, onDestroy: onDestroy, getJobMaterialClient: getJobMaterialClient, onWorkflowSelect: handleWorkflowSelect, onWorkflowUpdate: syncWorkflowWithJob, getRouteQueryTab: getRouteQueryTab, MaterialViewerComponent: MaterialViewerComponent, headerChildren: headerChildren, editable: editable }));
}
function JobLocalReduxContainer(props) {
    const { job, jobMaterials, metaProperties, workflow: _workflowBootstrap, ...restProps } = props;
    const storeContainerProps = { ...restProps, job, metaProperties };
    const store = useMemo(() => {
        var _a, _b, _c;
        const reducer = createJobDesignerReducer(job, jobMaterials, metaProperties);
        const enableLogging = typeof window !== "undefined" &&
            ((_c = (_b = (_a = window.Meteor) === null || _a === void 0 ? void 0 : _a.settings) === null || _b === void 0 ? void 0 : _b.public) === null || _c === void 0 ? void 0 : _c.enableJobDesignerLogging);
        return createStore(reducer, enableLogging ? applyMiddleware(logger) : undefined);
    }, []);
    return (_jsx(Provider, { store: store, context: JobDesignerReduxContext, children: _jsx(JobStoreLocalReduxContainer, { ...storeContainerProps }) }));
}
export default memo(JobLocalReduxContainer);
