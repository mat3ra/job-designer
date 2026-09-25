/* eslint-disable react/jsx-props-no-spreading */
import type { Template } from "@mat3ra/ade";
import type { Job } from "@mat3ra/jode";
import type { ResultsProps } from "@mat3ra/jove";
import type { MetaPropertyHolder } from "@mat3ra/prode";
import type { OrderedMaterial } from "@mat3ra/wode";
import type { WorkflowDesignerDialogs } from "@mat3ra/workflow-designer";
import React, { memo, useCallback, useEffect, useMemo } from "react";

import JobComponent from "../components/Job";
import { JobStatus } from "../exports";
import { useJobDesignerDeps } from "../JobDesignerContext";
import useJobDesignerState from "../state/useJobDesignerState";
import { getUnitEndpointsByFlowchartId, type JobPropertyRow } from "./utils/unitEndpoints";

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

type JobDesignerMetaProperty = MetaPropertyHolder;

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

interface JobStoreLocalReduxContainerProps {
    jobId?: string;
    job: Job;
    project: any;
    workflowId?: string;
    materials: OrderedMaterial[];
    metaProperties: JobDesignerMetaProperty[];
    accountUsers: JobDesignerUser[];
    accountUsersIsLoading: boolean;
    profile: JobDesignerProfile;
    publicAccount: JobDesignerAccount;
    clusters: JobDesignerCluster[];
    refreshMetaProperties: (val: string[]) => void;
    workflowDialogs: WorkflowDesignerDialogs;
    templates: Template[];
    resultsProperties: ResultsProps[];
    jobProperties: JobDesignerProperty[];
    createMetaProperty: (
        property: JobDesignerCreateMetaPropertyConfig,
    ) => Promise<JobDesignerMetaPropertyHolderSchema | undefined>;
    fetchMaterials: (ids: string[]) => Promise<JobDesignerMaterialSchema[]>;
    onMaterialAdd?: (materials: OrderedMaterial[], accounts?: any[]) => void;
    onMaterialRemove?: (indices: number[]) => void;
    onDestroy?: () => void;
    /** Opens the webapp-owned "select parent job" modal; the webapp handles the rest of that flow. */
    openSelectParentJobDialog: () => void;
    /** The parent job resolved by the webapp after a selection in that modal. */
    selectedParentJob?: Job;
    /** The resolved parent job's material(s), same shape MaterialTab/ResultsTab expect. */
    selectedParentJobMaterials?: any[];
    /** Opens the webapp-owned "import materials" modal (adds to the existing material list). */
    openAddMaterialsDialog: () => void;
    /** The material(s) picked in that modal. */
    addedMaterials?: any[];
    /** Opens the webapp-owned "select materials" modal (replaces the current material list). */
    openSelectMaterialsDialog: () => void;
    /** The material(s)/set picked in that modal. */
    selectedMaterials?: { materials: any[]; materialsSet?: any };
    /** Opens the webapp-owned "select workflow" modal. */
    openSelectWorkflowDialog: () => void;
    /** The workflow id picked in that modal, wrapped so re-picking the same id still re-applies. */
    selectedWorkflowId?: { id: string };
    /** Opens the webapp-owned "select dataset" modal. */
    openDatasetUploadsDialog: () => void;
    /** The dataset config picked in that modal. */
    selectedDataset?: any;
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
    jobMaterials: OrderedMaterial[];
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
    openSelectParentJobDialog,
    selectedParentJob,
    selectedParentJobMaterials,
    openAddMaterialsDialog,
    addedMaterials,
    openSelectMaterialsDialog,
    selectedMaterials,
    openSelectWorkflowDialog,
    selectedWorkflowId,
    openDatasetUploadsDialog,
    selectedDataset,
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
            // `stateMaterial` is `undefined` only when there are no materials at all, matching
            // pre-refactor behavior of passing it through as-is.
            nextJob.setMaterial(stateMaterial as OrderedMaterial);
            nextJob.setMaterials(stateMaterials);
            nextJob.setMaterialsSet(stateMaterialsSet);
            nextJob.setNameBasedOnMaterials(stateMaterials);
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

    // These wrap otherwise-stable state-hook setters (each a `useCallback` with `[]` deps) - as
    // plain inline arrows in the JSX below, they'd be a new function every render despite nothing
    // relevant changing, which is exactly what fed Job's dialog-result effects into rendering
    // forever (they read `onUpdate` transitively through `setParentJob`/`persistJob`/etc.).
    const handleUpdate = useCallback(
        (nextJob: any) => updateJob(nextJob, metaProperties),
        [updateJob, metaProperties],
    );
    const handleSave = useCallback(
        (omitRedirect?: boolean) => saveJob(project, omitRedirect),
        [saveJob, project],
    );
    const handleMaterialAdd = useCallback(
        (nextMaterials: any[], accounts?: any[]) => {
            addMaterials(nextMaterials, metaProperties);
            onMaterialAdd?.(nextMaterials, accounts);
        },
        [addMaterials, metaProperties, onMaterialAdd],
    );
    const handleMaterialRemove = useCallback(
        (indices: number[]) => {
            removeMaterials(indices, metaProperties);
            onMaterialRemove?.(indices);
        },
        [removeMaterials, metaProperties, onMaterialRemove],
    );
    const handleSetMaterials = useCallback(
        (nextMaterials: any[], nextMaterialsSet?: any) =>
            setMaterials(nextMaterials, nextMaterialsSet, metaProperties),
        [setMaterials, metaProperties],
    );
    const handleDestroy = useCallback(() => onDestroy?.(), [onDestroy]);

    // Previously `JobContainer`'s mapStateToProps/mapDispatchToProps. Dead passthroughs it used
    // to fabricate are gone: `allowedMaterials`/`allowedWorkflows` (always []) and
    // `onOutputUpdateRequest` (a no-op), plus the duplicated `onUpdateIndex`/`onMaterialSwitch`
    // pair its own TODO flagged - both dispatched the same action, so one remains.

    // The cast is the one typed seam here: jobProperties arrives from the webapp as
    // Record<string, unknown> rows, read through esse's property schema.
    const unitEndpointsByFlowchartId = useMemo(() => {
        if (!jobId) return {};
        return getUnitEndpointsByFlowchartId(jobId, jobProperties as unknown as JobPropertyRow[]);
    }, [jobId, jobProperties]);

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
            onUpdate={handleUpdate}
            onSave={handleSave}
            onSubmit={submitJob}
            onTerminate={terminateJob}
            onIsMultiMaterialChanged={setJobMultiMaterial}
            onUpdateIndex={switchMaterialByIndex}
            onMaterialSwitch={switchMaterialByIndex}
            onMaterialAdd={handleMaterialAdd}
            onMaterialRemove={handleMaterialRemove}
            onSetMaterials={handleSetMaterials}
            onSetDataset={setDataset}
            onWorkflowSelect={handleWorkflowSelect}
            onDestroy={handleDestroy}
            openSelectParentJobDialog={openSelectParentJobDialog}
            selectedParentJob={selectedParentJob}
            selectedParentJobMaterials={selectedParentJobMaterials}
            openAddMaterialsDialog={openAddMaterialsDialog}
            addedMaterials={addedMaterials}
            openSelectMaterialsDialog={openSelectMaterialsDialog}
            selectedMaterials={selectedMaterials}
            openSelectWorkflowDialog={openSelectWorkflowDialog}
            selectedWorkflowId={selectedWorkflowId}
            openDatasetUploadsDialog={openDatasetUploadsDialog}
            selectedDataset={selectedDataset}
            project={project}
            publicAccount={publicAccount}
            metaProperties={metaProperties}
            accountUsers={accountUsers}
            accountUsersIsLoading={accountUsersIsLoading}
            profile={profile}
            clusters={clusters}
            workflowDialogs={workflowDialogs}
            templates={templates}
            resultsProperties={resultsProperties}
            jobProperties={jobProperties}
            unitEndpointsByFlowchartId={unitEndpointsByFlowchartId}
            createMetaProperty={createMetaProperty}
            fetchMaterials={fetchMaterials}
            getRouteQueryTab={getRouteQueryTab}
            MaterialViewerComponent={MaterialViewerComponent}
            headerChildren={headerChildren}
        />
    );
}

export default memo(JobLocalReduxContainer);
