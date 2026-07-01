/* eslint-disable react/jsx-props-no-spreading */
import type { Template } from "@mat3ra/ade";
import React, { memo, useCallback, useEffect, useMemo } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { applyMiddleware, createStore } from "redux";
import logger from "redux-logger";

import type { ResultsProps } from "@mat3ra/jove";

interface JobDesignerUser {
    entity: { id: string; firstName?: string; lastName?: string; email?: string };
}

interface JobDesignerProfile {
    user: JobDesignerUser;
    personalAccount: JobDesignerAccount;
    account: JobDesignerAccount;
}

interface JobDesignerAccount {
    entity: { id: string; slug?: string; name?: string };
}

interface JobDesignerCluster {
    name: string;
    slug?: string;
    [key: string]: unknown;
}

interface JobDesignerMetaProperty {
    [key: string]: unknown;
}

interface JobDesignerProperty {
    [key: string]: unknown;
}

interface JobDesignerDialogState {
    isOpen: boolean;
    open: (...args: any[]) => void;
    close: () => void;
}

interface JobDesignerMaterialSchema {
    [key: string]: unknown;
}

interface JobDesignerMetaPropertyHolderSchema {
    [key: string]: unknown;
}

interface JobDesignerCreateMetaPropertyConfig {
    [key: string]: unknown;
}

import {
    setMaterials,
    syncJobWorkflow,
    updateJob,
} from "../actions";
import JobContainer from "./JobContainer";
import { createJobDesignerReducer } from "../reducers";
import type { Job } from "@mat3ra/jode";
import { setJobNameBasedOnMaterials } from "@mat3ra/jode";

interface JobStoreLocalReduxContainerProps {
    jobId?: string;
    job: Job;
    project: any;
    workflowId?: string;
    materials: any[];
    metaProperties: JobDesignerMetaProperty[];
    accountUsers: JobDesignerUser[];
    accountUsersIsLoading: boolean;
    profile: JobDesignerProfile;
    publicAccount: JobDesignerAccount;
    clusters: JobDesignerCluster[];
    refreshMetaProperties: (val: string[]) => void;
    jobDialogs: {
        selectMaterialsReduxDialog: JobDesignerDialogState;
        selectParentJobExplorerDialog: JobDesignerDialogState;
        selectWorkflowReduxDialog: JobDesignerDialogState;
        datasetUploadsReduxDialog: JobDesignerDialogState;
    };
    workflowDialogs: {
        pseudoUploadReduxDialog: JobDesignerDialogState;
        unitTypeReduxDialog: JobDesignerDialogState;
    };
    templates: Template[];
    resultsProperties: ResultsProps[];
    jobProperties: JobDesignerProperty[];
    createMetaProperty: (
        property: JobDesignerCreateMetaPropertyConfig,
    ) => Promise<JobDesignerMetaPropertyHolderSchema | undefined>;
    fetchMaterials: (ids: string[]) => Promise<JobDesignerMaterialSchema[]>;
    onMaterialAdd?: (materials: any[], accounts?: any[]) => void;
    onMaterialRemove?: (indices: number[]) => void;
    onDestroy?: () => void;
    getJobMaterialClient?: (job: Job) => Promise<any>;
}

type JobStoreLocalReduxContainerInnerProps = JobStoreLocalReduxContainerProps & {
    loadWorkflowEntityById: (workflowId: string) => Promise<any | undefined>;
};

type State = {
    materials: any[];
    material: any;
    job: Job;
    workflowContexts: object[];
    index: number;
    materialsSet?: any;
};

function JobStoreLocalReduxContainer({
    jobId,
    workflowId,
    materials,
    job,
    project,
    publicAccount,
    metaProperties,
    accountUsers,
    accountUsersIsLoading,
    profile,
    clusters,
    refreshMetaProperties,
    jobDialogs,
    workflowDialogs,
    templates,
    resultsProperties,
    jobProperties,
    createMetaProperty,
    fetchMaterials,
    loadWorkflowEntityById,
    onMaterialAdd,
    onMaterialRemove,
    onDestroy,
    getJobMaterialClient,
}: JobStoreLocalReduxContainerInnerProps) {
    const dispatch = useDispatch();
    const stateMaterials = useSelector((state: State) => state.materials);
    const stateMaterial = useSelector((state: State) => state.material);
    const stateJob = useSelector((state: State) => state.job);
    const stateWorkflowContexts = useSelector((state: State) => state.workflowContexts);
    const stateIndex = useSelector((state: State) => state.index);
    const stateMaterialsSet = useSelector((state: State) => state.materialsSet);

    const syncWorkflowWithJob = useCallback(
        (nextWorkflow: any) => {
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

            dispatch(
                syncJobWorkflow(
                    nextJob,
                    nextContexts,
                    Boolean(nextWorkflow.isMultiMaterial),
                    metaProperties,
                ),
            );
        },
        [
            dispatch,
            metaProperties,
            stateIndex,
            stateJob,
            stateMaterial,
            stateMaterials,
            stateMaterialsSet,
            stateWorkflowContexts,
        ],
    );

    const handleWorkflowSelect = useCallback(
        async (workflowId: string) => {
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

            dispatch(
                syncJobWorkflow(
                    nextJob,
                    nextContexts,
                    Boolean(nextWorkflow.isMultiMaterial),
                    metaProperties,
                ),
            );
        },
        [
            dispatch,
            loadWorkflowEntityById,
            metaProperties,
            stateIndex,
            stateJob,
            stateMaterial,
            stateMaterials,
            stateMaterialsSet,
            stateWorkflowContexts,
        ],
    );

    useEffect(() => {
        if (!jobId) return;
        dispatch(updateJob(job));
    }, [job, jobId, dispatch]);

    useEffect(() => {
        // Sync URL/query materials when opening an existing job before the user picks materials.
        // Create mode initializes materials from the local store; query ids are resolved upstream.
        // Do not pass materialsSet: undefined — that would drop ordered-set ordering for NEB images.
        if (!jobId || stateMaterials.length > 0 || !materials?.length) {
            return;
        }
        dispatch(setMaterials(materials, job.materialsSet ?? stateMaterialsSet, metaProperties));
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
        } else if (stateMaterial) {
            const newElements = stateMaterial.uniqueElements;
            refreshMetaProperties(newElements);
        }
    }, [stateMaterials, stateMaterial, dispatch, refreshMetaProperties]);

    useEffect(() => {
        if (!workflowId || jobId) return;
        handleWorkflowSelect(workflowId).catch(console.error);
    }, [jobId, workflowId]);

    return (
        <JobContainer
            project={project}
            publicAccount={publicAccount}
            metaProperties={metaProperties}
            accountUsers={accountUsers}
            accountUsersIsLoading={accountUsersIsLoading}
            profile={profile}
            clusters={clusters}
            jobDialogs={jobDialogs}
            workflowDialogs={workflowDialogs}
            templates={templates}
            resultsProperties={resultsProperties}
            jobProperties={jobProperties}
            createMetaProperty={createMetaProperty}
            fetchMaterials={fetchMaterials}
            onMaterialAdd={onMaterialAdd}
            onMaterialRemove={onMaterialRemove}
            onDestroy={onDestroy}
            getJobMaterialClient={getJobMaterialClient}
            onWorkflowSelect={handleWorkflowSelect}
            onWorkflowUpdate={syncWorkflowWithJob}
        />
    );
}

type JobLocalReduxContainerProps = JobStoreLocalReduxContainerProps & {
    jobMaterials: any[];
    /** Used by `JobGlobalReduxContainer` to build the default job; not read by the local store layer. */
    workflow?: any;
    loadWorkflowEntityById: (workflowId: string) => Promise<any | undefined>;
};

function JobLocalReduxContainer(props: JobLocalReduxContainerProps) {
    const { job, jobMaterials, metaProperties, workflow: _workflowBootstrap, ...restProps } = props;
    const storeContainerProps = { ...restProps, job, metaProperties };

    const store = useMemo(() => {
        const reducer = createJobDesignerReducer(job, jobMaterials, metaProperties);

        const enableLogging = typeof window !== "undefined" && (window as any).Meteor?.settings?.public?.enableJobDesignerLogging;
        return createStore(
            reducer,
            enableLogging ? applyMiddleware(logger as any) : undefined,
        );
    }, []);

    return (
        <Provider store={store}>
            <JobStoreLocalReduxContainer {...storeContainerProps} />
        </Provider>
    );
}

export default memo(JobLocalReduxContainer);
