/* eslint-disable react/jsx-props-no-spreading */
import type { Template } from "@mat3ra/ade";
import type { Job } from "@mat3ra/jode";
import { setJobNameBasedOnMaterials } from "@mat3ra/jode";
import type { ResultsProps } from "@mat3ra/jove";
import React, { memo, useCallback, useEffect } from "react";

import JobComponent from "../components/Job";
import { JobStatus } from "../exports";
import { type JobDesignerDialogTuple, useJobDesignerDeps } from "../JobDesignerContext";
import useJobDesignerState from "../state/useJobDesignerState";

interface JobDesignerUser {
    entity: { id?: string; firstName?: string; lastName?: string; email?: string };
}

interface JobDesignerProfile {
    user: JobDesignerUser;
    personalAccount: JobDesignerAccount;
    account: JobDesignerAccount;
}

interface JobDesignerAccount {
    entity: { id?: string; slug?: string; name?: string };
}

interface JobDesignerCluster {
    hostname: string;
    displayName?: string;
    isDefault?: boolean;
}

type JobDesignerMetaProperty = object;

type JobDesignerProperty = object;

type JobDesignerMaterialSchema = object;

type JobDesignerMetaPropertyHolderSchema = object;

interface JobDesignerCreateMetaPropertyConfig {
    element: string;
    approximation: string;
    functional: string;
    type: "us" | "nc" | "nc-fr" | "paw" | "coulomb";
    filename: string;
    application: string;
    content: string;
}

/**
 * `workflowDialogs` is populated by the webapp's own `useReduxDialog` (bypassing job-designer's
 * DI shim), which returns a `ReduxDialogState` - an interface extending `Array<unknown>` with
 * required indices 0/1/2, not a literal tuple type. A literal readonly tuple isn't structurally
 * assignable from that (mismatched inherited Array<T> method signatures), so this mirrors the
 * same "interface extends Array<unknown>" shape instead of declaring a tuple.
 */
interface JobDesignerWorkflowDialogTuple extends Array<unknown> {
    0: (...args: any[]) => void;
    1: () => void;
}

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
        selectMaterialsReduxDialog: JobDesignerDialogTuple;
        selectParentJobExplorerDialog: JobDesignerDialogTuple;
        selectWorkflowReduxDialog: JobDesignerDialogTuple;
        datasetUploadsReduxDialog: JobDesignerDialogTuple;
    };
    workflowDialogs: {
        pseudoUploadReduxDialog: JobDesignerWorkflowDialogTuple;
        unitTypeReduxDialog: JobDesignerWorkflowDialogTuple;
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
    /** Optional injectable material viewer component (e.g. ThreeDEditor from wave.js). */
    MaterialViewerComponent?: React.ComponentType<{ material: any }>;
    /** Optional children rendered in the EntityHeader right slot (selectors, export button, etc.). */
    headerChildren?: React.ReactNode;
    /**
     * Accepted (web-app passes it) but deliberately not read: the old `mapStateToProps` spread
     * `...ownProps` first and then set `editable` from job status, so the computed value has
     * always won over the prop. Preserved rather than quietly changed.
     */
    // eslint-disable-next-line react/no-unused-prop-types
    editable?: boolean;
}

type JobLocalReduxContainerProps = JobStoreLocalReduxContainerProps & {
    jobMaterials: any[];
    /** Used by `JobGlobalReduxContainer` to build the default job; not read by the state layer. */
    workflow?: any;
    loadWorkflowEntityById: (workflowId: string) => Promise<any | undefined>;
};

function JobLocalReduxContainer({
    jobId,
    workflowId,
    materials,
    job,
    jobMaterials,
    workflow: _workflowBootstrap,
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
    MaterialViewerComponent,
    headerChildren,
}: JobLocalReduxContainerProps) {
    const {
        job: stateJob,
        material: stateMaterial,
        materials: stateMaterials,
        materialsSet: stateMaterialsSet,
        workflowContexts: stateWorkflowContexts,
        index: stateIndex,
        currentMaterial,
        isMultiMaterial,
        datasetConfig,
        renderGeneration,
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
    } = useJobDesignerState({ job, jobMaterials, metaProperties });
    const { getRouteQueryTab } = useJobDesignerDeps();

    // NOTE: a `syncWorkflowWithJob` callback used to live here and be passed down as
    // `onWorkflowUpdate`. It was unreachable: `Job` defined its own `onWorkflowUpdate` method and
    // passed THAT to `WorkflowTab` (Job.jsx:710), so the prop threaded through JobContainer.js:90
    // was never read. Removed rather than carried forward — see git history if the richer
    // clone/updateMethodData/re-attach behaviour is ever actually wanted.
    const handleWorkflowSelect = useCallback(
        async (selectedWorkflowId: string) => {
            const nextWorkflow = await loadWorkflowEntityById(selectedWorkflowId);
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

            syncJobWorkflow(
                nextJob,
                nextContexts,
                Boolean(nextWorkflow.isMultiMaterial),
                metaProperties,
            );
        },
        [
            syncJobWorkflow,
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
        updateJob(job);
    }, [job, jobId, updateJob]);

    useEffect(() => {
        // Sync URL/query materials when opening an existing job before the user picks materials.
        // Create mode initializes materials from the state hook; query ids are resolved upstream.
        // Do not pass materialsSet: undefined — that would drop ordered-set ordering for NEB images.
        if (!jobId || stateMaterials.length > 0 || !materials?.length) {
            return;
        }
        setMaterials(materials, job.materialsSet ?? stateMaterialsSet, metaProperties);
    }, [
        jobId,
        job.materialsSet,
        materials,
        metaProperties,
        setMaterials,
        stateMaterials.length,
        stateMaterialsSet,
    ]);

    useEffect(() => {
        if (stateMaterials.length) {
            const elementsArrays = stateMaterials
                .filter((material: any) => material)
                .map((material: any) => material.uniqueElements);
            const newElements = Array.from(new Set<string>(elementsArrays.flat()));
            refreshMetaProperties(newElements);
        } else if (stateMaterial) {
            const newElements = stateMaterial.uniqueElements;
            refreshMetaProperties(newElements);
        }
    }, [stateMaterials, stateMaterial, refreshMetaProperties]);

    useEffect(() => {
        if (!workflowId || jobId) return;
        handleWorkflowSelect(workflowId).catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobId, workflowId]);

    // Previously `JobContainer`'s mapStateToProps/mapDispatchToProps. Dead passthroughs it used
    // to fabricate are gone: `allowedMaterials`/`allowedWorkflows` (always []) and
    // `onOutputUpdateRequest` (a no-op), plus the duplicated `onUpdateIndex`/`onMaterialSwitch`
    // pair its own TODO flagged - both dispatched the same action, so one remains.
    return (
        <JobComponent
            job={stateJob}
            isLoading={isLoading}
            editable={stateJob.status === JobStatus.pre_submission}
            isMultiMaterial={isMultiMaterial || false}
            index={stateIndex}
            length={stateMaterials.length}
            material={currentMaterial}
            materials={stateMaterials}
            materialsSet={stateMaterialsSet}
            datasetConfig={datasetConfig}
            renderGeneration={renderGeneration}
            onUpdate={(nextJob: any) => updateJob(nextJob, metaProperties)}
            onSave={(omitRedirect?: boolean) => saveJob(project, omitRedirect)}
            onSubmit={submitJob}
            onTerminate={terminateJob}
            onIsMultiMaterialChanged={setJobMultiMaterial}
            onUpdateIndex={switchMaterialByIndex}
            onMaterialSwitch={switchMaterialByIndex}
            onMaterialAdd={(nextMaterials: any[], accounts?: any[]) => {
                addMaterials(nextMaterials, metaProperties);
                onMaterialAdd?.(nextMaterials, accounts);
            }}
            onMaterialRemove={(indices: number[]) => {
                removeMaterials(indices, metaProperties);
                onMaterialRemove?.(indices);
            }}
            onSetMaterials={(nextMaterials: any[], nextMaterialsSet?: any) =>
                setMaterials(nextMaterials, nextMaterialsSet, metaProperties)
            }
            onSetDataset={setDataset}
            onWorkflowSelect={handleWorkflowSelect}
            onDestroy={() => onDestroy?.()}
            getJobMaterialClient={async (parentJob: any) =>
                getJobMaterialClient ? getJobMaterialClient(parentJob) : null
            }
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
            getRouteQueryTab={getRouteQueryTab}
            MaterialViewerComponent={MaterialViewerComponent}
            headerChildren={headerChildren}
        />
    );
}

export default memo(JobLocalReduxContainer);
