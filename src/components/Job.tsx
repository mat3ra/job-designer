/* eslint-disable jsx-a11y/anchor-is-valid */
import ButtonMultiSelect from "@mat3ra/cove/dist/mui/components/button/ButtonMultiSelect";
import Dropdown from "@mat3ra/cove/dist/mui/components/dropdown/Dropdown";
import IconByName from "@mat3ra/cove/dist/mui/components/icon/IconByName";
import TabsMenu from "@mat3ra/cove/dist/mui/components/tabs/TabsMenu";
import { EntityHeader } from "@mat3ra/cove/dist/mui-composed/components/entity-header/EntityHeader";
import LoadingIndicator from "@mat3ra/cove/dist/mui-composed/components/loading/LoadingIndicator";
import { showWarningAlert } from "@mat3ra/cove/dist/other/alerts";
import { TAB_NAVIGATION_CONFIG } from "@mat3ra/jode";
import { ResultsTab } from "@mat3ra/jove";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import React, { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { getInjectedDeps } from "../setDependencies";
import { shouldPersistJobOnUpdate } from "../shouldPersistJobOnUpdate";
import ComputeTab from "./ComputeTab";
import DatasetTab from "./DatasetTab";
import FilesTab from "./FilesTab";
import MaterialTab from "./MaterialTab";
import useEntityAlerts from "./useEntityAlerts";
import WorkflowTab from "./WorkflowTab";

// Resolved lazily (not at module load) so it picks up the real webapp DAOProvider injected via
// setDependencies(), which runs after this module is first imported.
const getDAOProvider = () =>
    (getInjectedDeps() as any).DAOProvider ?? { get: () => ({ findByIds: () => [] }) };
// Same lazy-resolution pattern: pulls host-app file helpers already registered via
// setDependencies() for forwarding into ResultsTab (see the render below).
const getFileUtils = () => {
    const deps = getInjectedDeps() as any;
    return {
        downloadAndProcessFile: deps.downloadAndProcessFile,
        handleGetSignedURL: deps.handleGetSignedURL,
        handleGetSignedUrlAsCSV: deps.handleGetSignedUrlAsCSV,
    };
};
const triggerChartsResize = () => {};
const getConditionalTabs = (
    config: Record<string, any>,
    conditionalMap: Record<string, boolean>,
    key: string,
) => Object.values(config).filter((tab: any) => conditionalMap[tab[key]] !== false);
const createMessageTextTAPi18n = (key: string) => key;

export interface JobProps {
    job: any;
    editable?: boolean;
    isLoading?: boolean;
    hideDescription?: boolean;
    material?: any;
    materials: any[];
    materialsSet?: any;
    index: number;
    length: number;
    datasetConfig?: any;
    metaProperties: any[];
    isMultiMaterial?: boolean;
    clusters?: any[];
    profile: any;
    publicAccount?: any;
    project?: any;
    accountUsers: any[];
    accountUsersIsLoading: boolean;
    templates?: any[];
    resultsProperties?: any[];
    jobProperties?: any[];
    renderGeneration?: number;
    jobDialogs: Record<string, any>;
    workflowDialogs?: Record<string, any>;
    createMetaProperty?: (config: any) => Promise<any>;
    fetchMaterials?: (ids: string[]) => Promise<any[]>;
    getRouteQueryTab?: () => string | null;
    /** Optional injectable material viewer component (e.g. ThreeDEditor from wave.js). */
    MaterialViewerComponent?: React.ComponentType<any>;
    /** Optional children rendered in the right side of the EntityHeader. */
    headerChildren?: React.ReactNode;
    /* handlers */
    onUpdate: (job: any) => void;
    onSave: (omitRedirect?: boolean) => void;
    onSubmit?: () => void;
    onTerminate?: () => void;
    onDestroy?: () => void;
    onSetMaterials?: (materials: any[], materialsSet?: any) => void;
    onSetDataset?: (dataset: any) => void;
    onMaterialAdd?: (materials: any[], accounts?: any[]) => void;
    onMaterialRemove: (indices: number[]) => void;
    onUpdateIndex: (index: number) => void;
    onMaterialSwitch?: (index: number) => void;
    onIsMultiMaterialChanged?: (isMultiMaterial: boolean) => void;
    onWorkflowSelect?: (workflowId: string) => Promise<void> | void;
    onOutputUpdateRequest?: () => void;
    getJobMaterialClient?: (job: any) => Promise<any>;
}

/** True when the workflow drives a dataset rather than materials. */
function isUsingDatasetTabFor(entity: any) {
    return entity?.workflowInstance?.isUsingDataset || false;
}

function isUsingMaterialFor(entity: any) {
    return Boolean(
        entity?.workflowInstance?.subworkflows?.some((subworkflow: any) =>
            ["vasp", "nwchem", "espresso"].includes(subworkflow.application.name),
        ),
    );
}

function resolveDefaultTab(job: any, getRouteQueryTab?: () => string | null) {
    let tab = getRouteQueryTab?.() ?? null;

    if (job.isSubmitted || job.isActive || job.isError) {
        tab = TAB_NAVIGATION_CONFIG.workflow.id;
    } else if (job.isInFinalStatus) {
        tab = TAB_NAVIGATION_CONFIG.results.id;
    } else if (job.workflowInstance.isUsingDataset) {
        tab = TAB_NAVIGATION_CONFIG.dataset.id;
    } else if (isUsingMaterialFor(job)) {
        tab = TAB_NAVIGATION_CONFIG.material.id;
    }

    return tab || TAB_NAVIGATION_CONFIG.workflow.id;
}

function Job(props: JobProps) {
    const {
        job,
        editable,
        isLoading,
        hideDescription,
        material,
        index,
        length,
        onUpdateIndex,
        onMaterialRemove,
        datasetConfig,
        onWorkflowSelect,
        materials,
        materialsSet,
        metaProperties,
        onIsMultiMaterialChanged,
        onMaterialSwitch,
        onOutputUpdateRequest,
        clusters,
        profile,
        accountUsers,
        accountUsersIsLoading,
        workflowDialogs,
        publicAccount,
        project,
        templates,
        resultsProperties,
        jobProperties,
        createMetaProperty,
        fetchMaterials,
        renderGeneration,
        MaterialViewerComponent,
        headerChildren,
        jobDialogs,
        isMultiMaterial,
        onUpdate,
        onSave,
        onSubmit,
        onTerminate,
        onDestroy,
        onSetMaterials,
        onSetDataset,
        onMaterialAdd,
        getJobMaterialClient,
        getRouteQueryTab,
    } = props;

    // Local working copy of the job, mirroring the class component's `state.entity`.
    const [entity, setEntity] = useState<any>(job);
    const [currentTab, setCurrentTabState] = useState<string>(() =>
        resolveDefaultTab(job, getRouteQueryTab),
    );
    const [isWorkflowLoading, setIsWorkflowLoading] = useState(false);
    // The job is mutated IN PLACE, so `setEntity(sameRef)` is a no-op under `useState`'s
    // Object.is bail-out (the class component didn't have this problem, since setState always
    // scheduled a render and `shouldComponentUpdate` decided). This forces the re-render that
    // in-place edits — name, description, compute, parent — need in order to show up.
    const [, bumpRevision] = useReducer((x: number) => x + 1, 0);

    const { renderErrors, renderWarnings } = useEntityAlerts(entity);

    // Read at click time rather than closed over: cove's `ButtonMultiSelect` snapshots
    // `buttonConfigs[0]` on mount and never resyncs, so it keeps calling the very first
    // `onClick` it received. A captured entity would persist the job as it was on the first
    // render, silently reverting every later edit.
    const entityRef = useRef(entity);
    entityRef.current = entity;

    const persistJob = useCallback(() => onUpdate(entityRef.current), [onUpdate]);

    const resetEntityAndUpdateParents = useCallback(
        (nextEntity?: any, callback?: () => void) => {
            const resolved = nextEntity || entityRef.current;
            entityRef.current = resolved;
            setEntity(resolved);
            bumpRevision();
            onUpdate(resolved);
            callback?.();
        },
        [onUpdate],
    );

    // componentDidMount: persist the initial entity once.
    useEffect(() => {
        persistJob();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // componentWillUnmount
    useEffect(() => () => onDestroy?.(), [onDestroy]);

    // componentDidUpdate: resync the working copy when the parent swaps the job, and persist
    // when external context changed without the job being replaced (see shouldPersistJobOnUpdate).
    const prevPropsRef = useRef(props);
    useEffect(() => {
        const prevProps = prevPropsRef.current;
        const nextProps = props;
        prevPropsRef.current = nextProps;

        if (prevProps.job !== job) {
            setEntity(job);
            entityRef.current = job;
        }
        if (shouldPersistJobOnUpdate(prevProps, nextProps)) {
            persistJob();
        }
    });

    const isUsingDatasetTab = useMemo(() => isUsingDatasetTabFor(entity), [entity]);
    // NOTE: TB tmp disabled the `isUsingMaterial` condition to show the materials tab for old
    // jobs/workflows.
    const isUsingMaterialsTab = !isUsingDatasetTab;

    const setCurrentTab = useCallback(
        (tabName: string) => {
            triggerChartsResize();
            setCurrentTabState(tabName);
            if (tabName === TAB_NAVIGATION_CONFIG.workflow.id) {
                persistJob();
            }
        },
        [persistJob],
    );

    /** Workflow tab edits mutate wode models in place, then persist via `onUpdate`. */
    const onWorkflowUpdate = useCallback(
        (workflow: any) => {
            const { current } = entityRef;
            current.setWorkflow(workflow);
            onUpdate(current);
        },
        [onUpdate],
    );

    const onComputeUpdate = useCallback(
        (compute: any) => {
            const { current } = entityRef;
            current.setCompute(compute);
            resetEntityAndUpdateParents(current);
        },
        [resetEntityAndUpdateParents],
    );

    const onNameUpdate = useCallback(
        (name: string) => {
            const { current } = entityRef;
            current.setName(name);
            resetEntityAndUpdateParents(current);
        },
        [resetEntityAndUpdateParents],
    );

    const onDescriptionUpdate = useCallback(
        (descriptionObject: any, description: string) => {
            const { current } = entityRef;
            current.descriptionObject = descriptionObject;
            current.description = description;
            resetEntityAndUpdateParents(current);
        },
        [resetEntityAndUpdateParents],
    );

    const setParentJob = useCallback(
        (parent: any) => {
            const { current } = entityRef;
            current.setParent(parent);
            resetEntityAndUpdateParents(current);
        },
        [resetEntityAndUpdateParents],
    );

    const onParentRemove = useCallback(() => {
        const { current } = entityRef;
        current.unsetParent();
        resetEntityAndUpdateParents(current);
    }, [resetEntityAndUpdateParents]);

    // ─── Dialogs ──────────────────────────────────────────────────────────────────────

    const openAddMaterialsDialog = useCallback(() => {
        const [open, close] = jobDialogs.selectMaterialsReduxDialog;
        open({
            id: "material-add",
            title: "Import materials",
            onClose: close,
            omitEntitySelection: false,
            selectionLimit: 0,
            onSubmit: (nextMaterials: any[]) => {
                onMaterialAdd?.(nextMaterials, profile.accounts);
                close();
            },
        });
    }, [jobDialogs, onMaterialAdd, profile]);

    const onMaterialsModalSubmit = useCallback(
        (nextMaterials: any[], nextMaterialsSet?: any) => {
            // for new or multimaterial jobs - add materials
            if (nextMaterials.length > 1 && entityRef.current.id && !isMultiMaterial) {
                // otherwise - throw error re-using generic message for workflows
                showWarningAlert(createMessageTextTAPi18n("workflow.errors.select.singleOnly"));
                return;
            }
            onSetMaterials?.(nextMaterials, nextMaterialsSet);
            setCurrentTab(TAB_NAVIGATION_CONFIG.material.id);
        },
        [isMultiMaterial, onSetMaterials, setCurrentTab],
    );

    const openSelectMaterialsDialog = useCallback(() => {
        const [open, close] = jobDialogs.selectMaterialsReduxDialog;
        open({
            title: "Select Materials",
            onClose: close,
            omitEntitySelection: false,
            selectionLimit: 0,
            onSubmit: (nextMaterials: any[], nextMaterialsSet?: any) => {
                onMaterialsModalSubmit(nextMaterials, nextMaterialsSet);
                close();
            },
        });
    }, [jobDialogs, onMaterialsModalSubmit]);

    const closeSelectParentJobDialog = useCallback(() => {
        const [, close] = jobDialogs.selectParentJobExplorerDialog;
        close();
    }, [jobDialogs]);

    const onSelectParentJobSubmit = useCallback(
        async (ids: string[]) => {
            // Entity DAO key is the string "Job"; do not use a class's .name - build tools may
            // mangle/shorten class names during minification (ports mat3ra/web-app#2928, SOF-7962).
            const jobs = getDAOProvider().get("Job").findByIds(ids);

            if (jobs.length > 1) {
                showWarningAlert(createMessageTextTAPi18n("workflow.errors.select.singleOnly"));
                return;
            }

            const parentJob = jobs[0];
            if (!parentJob) {
                // DAO lookup miss for a job the user just picked from a loaded list (e.g. a stale
                // cache) - getJobMaterialClient's own contract expects a real Job, not undefined.
                console.error(
                    "onSelectParentJobSubmit: no Job entity found for the selected id(s)",
                );
                return;
            }
            // TODO: figure out how to deal with multimaterial jobs
            const parentMaterials = [await getJobMaterialClient?.(parentJob)];
            setParentJob(parentJob);
            onSetMaterials?.(parentMaterials);
            closeSelectParentJobDialog();
        },
        [getJobMaterialClient, setParentJob, onSetMaterials, closeSelectParentJobDialog],
    );

    const openSelectParentJobDialog = useCallback(() => {
        const [open, close] = jobDialogs.selectParentJobExplorerDialog;
        open({
            onClose: close,
            customActions: { selectItems: onSelectParentJobSubmit, open: onSelectParentJobSubmit },
        });
    }, [jobDialogs, onSelectParentJobSubmit]);

    const closeSelectWorkflowDialog = useCallback(() => {
        const [, close] = jobDialogs.selectWorkflowReduxDialog;
        close();
    }, [jobDialogs]);

    const onSelectWorkflowsSubmit = useCallback(
        async (ids: string[]) => {
            if (ids.length !== 1) {
                showWarningAlert(createMessageTextTAPi18n("workflow.errors.select.singleOnly"));
                return;
            }

            closeSelectWorkflowDialog();
            setIsWorkflowLoading(true);
            try {
                await onWorkflowSelect?.(ids[0]);
            } catch (error) {
                console.error("Failed to load selected workflow", error);
            } finally {
                setIsWorkflowLoading(false);
                setCurrentTab(TAB_NAVIGATION_CONFIG.workflow.id);
            }
        },
        [closeSelectWorkflowDialog, onWorkflowSelect, setCurrentTab],
    );

    const openSelectWorkflowDialog = useCallback(() => {
        const [open, close] = jobDialogs.selectWorkflowReduxDialog;
        open({
            onClose: close,
            customActions: { selectItems: onSelectWorkflowsSubmit, open: onSelectWorkflowsSubmit },
        });
    }, [jobDialogs, onSelectWorkflowsSubmit]);

    const openDatasetUploadsDialog = useCallback(() => {
        const [open, close] = jobDialogs.datasetUploadsReduxDialog;
        open({
            onClose: close,
            account: profile.account.entity,
            itemClickCallback: (dataset: any) => {
                onSetDataset?.(dataset);
                close();
            },
            selectItemsCallback: (datasetConfigs: any[]) => {
                if (datasetConfigs.length > 1) {
                    showWarningAlert(createMessageTextTAPi18n("workflow.errors.select.singleOnly"));
                    return;
                }
                onSetDataset?.(datasetConfigs[0]);
                close();
                setCurrentTab(TAB_NAVIGATION_CONFIG.dataset.id);
            },
        });
    }, [jobDialogs, profile, onSetDataset, setCurrentTab]);

    // ─── Header actions ───────────────────────────────────────────────────────────────

    const getDefaultActions = useCallback(() => {
        const { current } = entityRef;
        const actions: any[] = [
            {
                isShown: current.isInInitialStatus && isUsingMaterialsTab,
                id: "select-material",
                content: "Select materials",
                onClick: openSelectMaterialsDialog,
                icon: <IconByName name="entities.material" />,
            },
            {
                isShown: current.isInInitialStatus,
                icon: <IconByName name="entities.workflow" />,
                id: "select-workflow",
                content: "Select workflow",
                onClick: openSelectWorkflowDialog,
            },
            {
                isShown: current.isInInitialStatus,
                icon: <IconByName name="entities.job" />,
                id: "select-parent-job",
                content: "Select parent",
                onClick: openSelectParentJobDialog,
            },
            {
                // TODO: not covered by design icon to be added
                isShown: current.isInInitialStatus && isUsingDatasetTab,
                id: "select-dataset",
                content: "Select dataset",
                onClick: openDatasetUploadsDialog,
            },
            {
                isShown: Boolean(current.id && current.isInInitialStatus),
                id: "select-submit",
                content: "Submit",
                onClick: onSubmit,
            },
            {
                isShown: Boolean(current.id && current.isInRunningStatus),
                id: "select-terminate",
                content: "Terminate",
                onClick: onTerminate,
            },
        ];

        // renders divider if some actions should be shown
        if (actions.some((item) => item.isShown)) {
            actions.push({ isDivider: true, id: "select-divider" });
        }

        return actions;
    }, [
        isUsingMaterialsTab,
        isUsingDatasetTab,
        openSelectMaterialsDialog,
        openSelectWorkflowDialog,
        openSelectParentJobDialog,
        openDatasetUploadsDialog,
        onSubmit,
        onTerminate,
    ]);

    const isDesignerLoading = Boolean(isLoading) || isWorkflowLoading;

    const dropdownProps = useMemo(() => {
        const actions = getDefaultActions();
        // Collapse separators with no visible action after them (e.g. the trailing group divider
        // when nothing follows) - otherwise the menu renders a dangling divider line.
        const hasVisibleActionAfter = (i: number) =>
            actions.slice(i + 1).some((action) => !action.isDivider && action.isShown !== false);
        const cleanedActions = actions.filter(
            (action, i) => !action.isDivider || hasVisibleActionAfter(i),
        );
        return {
            isShown: cleanedActions.some((a) => !a.isDivider && a.isShown !== false),
            className: "pull-right action-dropdown",
            actions: cleanedActions,
            buttonContent: "Select Job Actions",
        };
    }, [getDefaultActions]);

    // `isShown` is Job's own render guard, NOT part of cove's `DropdownProps` (only the per-action
    // `DropdownAction` has one). `Dropdown` spreads unrecognised props onto a MUI `Box`, which
    // forwards them to a DOM div - React then warns "does not recognize the `isShown` prop on a
    // DOM element". The injected webapp header below still gets the full object, since its
    // `dropdownProps` contract does read `isShown`.
    const { isShown: isDropdownShown, ...dropdownComponentProps } = dropdownProps;

    const saveBtnProps = useMemo(
        () => ({
            id: "save-button",
            buttonConfigs: [
                {
                    id: "save",
                    label: "Save",
                    // "actions.save" is the real map entry (MUI Save); "shapes.save" doesn't exist
                    // in cove's IconByName map and fell back to a plain Circle glyph.
                    iconName: "actions.save",
                    onClick: (...args: any[]) =>
                        resetEntityAndUpdateParents(entityRef.current, () =>
                            (onSave as any)(...args),
                        ),
                },
            ],
            localStorageKey: "job-designer-save-button",
            isLoading: isDesignerLoading,
        }),
        [resetEntityAndUpdateParents, onSave, isDesignerLoading],
    );

    const parentJob = entity.getParentJobClient?.();
    const renderParentJob = () =>
        parentJob ? (
            <Alert severity="info" onClose={editable ? onParentRemove : undefined}>
                <div className="search-pill-selected">
                    Parent job:{" "}
                    <b>
                        <a href="" onClick={parentJob.open}>
                            {parentJob.name}
                        </a>
                    </b>{" "}
                    from&nbsp;
                    <b>{parentJob._project.slug}</b> project
                </div>
            </Alert>
        ) : null;

    // ─── Render ───────────────────────────────────────────────────────────────────────

    const currentAccount = profile.account.entity;
    const currentUser = profile.user.entity;

    // TODO: refactor for modularity - consider advanced options useful only for workflows that
    // contain espresso
    const allApps = entity.workflowInstance.usedApplications;
    const showAdvancedCompute =
        allApps.length > 0
            ? allApps
                  .map((a: any) => a.hasAdvancedComputeOptions)
                  .reduce((x: boolean, y: boolean) => x && y)
            : false;

    const isCurrentTab = (tabNameId: string) => currentTab === tabNameId;
    const isCurrentTabWorkflow = isCurrentTab(TAB_NAVIGATION_CONFIG.workflow.id);
    const isCurrentTabMaterial = isCurrentTab(TAB_NAVIGATION_CONFIG.material.id);
    const isCurrentTabDataset = isCurrentTab(TAB_NAVIGATION_CONFIG.dataset.id);
    const isCurrentTabResults = isCurrentTab(TAB_NAVIGATION_CONFIG.results.id);
    const isCurrentTabFiles = isCurrentTab(TAB_NAVIGATION_CONFIG.files.id);
    const isCurrentTabCompute = isCurrentTab(TAB_NAVIGATION_CONFIG.compute.id);

    const conditionalTabsMap = {
        [TAB_NAVIGATION_CONFIG.material.id]: isUsingMaterialsTab && Boolean(material),
        [TAB_NAVIGATION_CONFIG.dataset.id]: isUsingDatasetTab,
        [TAB_NAVIGATION_CONFIG.results.id]: !entity.isInInitialStatus,
        [TAB_NAVIGATION_CONFIG.files.id]: !entity.isInInitialStatus,
    };

    const tabsToRender = getConditionalTabs(TAB_NAVIGATION_CONFIG, conditionalTabsMap, "id");
    const tabs = tabsToRender.map((tab: any) => ({ ...tab, onClick: () => setCurrentTab(tab.id) }));
    const activeTabIndex = tabsToRender.findIndex((item: any) => item.id === currentTab);

    // In the webapp this checks user permissions; standalone always allows editing.
    const isDescriptionEditable = true;
    const isActive = (value: boolean) => (value ? "active" : null);

    // The webapp injects its full EntityHeader organism (description toggle/editor, Save & Exit
    // split button) for production parity; standalone falls back to cove's minimal EntityHeader.
    const InjectedEntityHeader = (getInjectedDeps() as any).EntityHeaderComponent;

    return (
        <ErrorBoundary fallback={<div />}>
            {InjectedEntityHeader ? (
                <InjectedEntityHeader
                    name={entity.name}
                    editable={editable}
                    onNameUpdate={onNameUpdate}
                    isLoading={isDesignerLoading}
                    subtitle={project?.name ? { project: project.name } : undefined}
                    description={entity.description}
                    icon="entities.job"
                    iconCls={`text-${entity.statusCls}`}
                    id="job-designer-header"
                    saveBtnProps={{
                        isShown: Boolean(editable),
                        isLoading: isDesignerLoading,
                        // Read the entity at call time (not a render-time capture): the organism's
                        // ButtonMultiSelect snapshots its configs on mount, so a captured entity
                        // would forever persist the very first render's state.
                        onSave: (omitRedirect: boolean) =>
                            resetEntityAndUpdateParents(entityRef.current, () =>
                                onSave(omitRedirect),
                            ),
                    }}
                    dropdownProps={dropdownProps}
                    descriptionEditorTitle="Job Description"
                    isDescriptionEditorHidden={hideDescription}
                    item={entity}
                    isDescriptionEditable={isDescriptionEditable}
                    onDescriptionUpdate={onDescriptionUpdate}
                >
                    {headerChildren ?? null}
                </InjectedEntityHeader>
            ) : (
                <EntityHeader
                    name={entity.name}
                    editable={editable}
                    onNameUpdate={onNameUpdate}
                    isLoading={isDesignerLoading}
                    subtitle={project?.name ? { project: project.name } : undefined}
                    icon="entities.job"
                    id="job-designer-header"
                >
                    {/* Actions dropdown to the left of Save, matching the pre-extraction header
                        (EntityHeader organism rendered Dropdown -> Pager -> Save). Hidden when no
                        action is currently shown - otherwise it opens an empty menu. */}
                    {isDropdownShown && <Dropdown {...dropdownComponentProps} />}
                    {editable && <ButtonMultiSelect {...saveBtnProps} />}
                    {headerChildren ?? null}
                </EntityHeader>
            )}
            {renderParentJob()}
            {renderErrors()}
            {renderWarnings()}
            <TabsMenu tabs={tabs} activeTabIndex={activeTabIndex} variant="fullWidth" centered />
            <Box>
                <div className="tab-content">
                    {isWorkflowLoading ? (
                        <LoadingIndicator included />
                    ) : (
                        <>
                            {isCurrentTabMaterial && (
                                <MaterialTab
                                    className={isCurrentTabMaterial ? "active" : undefined}
                                    id={TAB_NAVIGATION_CONFIG.material.id}
                                    publicAccount={publicAccount}
                                    profile={profile}
                                    role="tabpanel"
                                    material={material}
                                    index={index}
                                    length={length}
                                    onUpdateIndex={onUpdateIndex}
                                    onMaterialRemove={onMaterialRemove}
                                    addRemoveAllowed={!entity.id}
                                    openAddMaterialsDialog={openAddMaterialsDialog}
                                    MaterialViewerComponent={MaterialViewerComponent}
                                />
                            )}
                            {isCurrentTabDataset && (
                                <DatasetTab
                                    className={isCurrentTabDataset ? "active" : undefined}
                                    id={TAB_NAVIGATION_CONFIG.dataset.id}
                                    profile={profile}
                                    role="tabpanel"
                                    datasetConfig={datasetConfig}
                                />
                            )}
                            {isCurrentTabWorkflow && (
                                <WorkflowTab
                                    className={isCurrentTabWorkflow ? "active" : undefined}
                                    workflowRenderGeneration={renderGeneration}
                                    id={TAB_NAVIGATION_CONFIG.workflow.id}
                                    role="tabpanel"
                                    workflow={entity.workflowInstance}
                                    onJobRender={persistJob}
                                    jobHasParent={Boolean(entity.getParentJobClient?.())}
                                    profile={profile}
                                    publicAccount={publicAccount}
                                    materials={materials}
                                    materialsSet={materialsSet}
                                    materialsIndex={index}
                                    onIsMultiMaterialChanged={onIsMultiMaterialChanged}
                                    onMaterialSwitch={onMaterialSwitch}
                                    onWorkflowUpdate={onWorkflowUpdate}
                                    adjustable={entity.isInInitialStatus}
                                    iconCls={`text-${entity.statusCls}`}
                                    metaProperties={metaProperties}
                                    onOutputUpdateRequest={onOutputUpdateRequest}
                                    accountUsers={accountUsers}
                                    accountUsersIsLoading={accountUsersIsLoading}
                                    dialogs={workflowDialogs}
                                    templates={templates}
                                    createMetaProperty={createMetaProperty}
                                    jobProperties={jobProperties}
                                    isDescriptionEditable={isDescriptionEditable}
                                />
                            )}
                            {isCurrentTabCompute && (
                                <ComputeTab
                                    className={isCurrentTabCompute ? "active" : undefined}
                                    id={TAB_NAVIGATION_CONFIG.compute.id}
                                    role="tabpanel"
                                    compute={entity.compute}
                                    job={entity}
                                    onUpdate={onComputeUpdate}
                                    editable={editable}
                                    clusters={clusters ?? []}
                                    showAdvancedOptions={showAdvancedCompute}
                                    accountUsers={accountUsers ?? []}
                                    accountUsersIsLoading={Boolean(accountUsersIsLoading)}
                                    currentUser={currentUser}
                                    currentAccount={currentAccount}
                                />
                            )}
                            {isCurrentTabResults && (
                                <ResultsTab
                                    className={`jobs-view ${isActive(isCurrentTabResults)}`}
                                    id={TAB_NAVIGATION_CONFIG.results.id}
                                    role="tabpanel"
                                    job={entity}
                                    material={material}
                                    publicAccount={publicAccount}
                                    profile={profile}
                                    resultsProperties={resultsProperties}
                                    jobProperties={jobProperties}
                                    fetchMaterials={fetchMaterials}
                                    MaterialComponent={MaterialViewerComponent}
                                    fileUtils={getFileUtils()}
                                    DataGridComponent={(getInjectedDeps() as any).DataGridComponent}
                                />
                            )}
                            {isCurrentTabFiles && (
                                <FilesTab
                                    className={`jobs-view ${isActive(isCurrentTabFiles)}`}
                                    id={TAB_NAVIGATION_CONFIG.files.id}
                                    role="tabpanel"
                                    job={entity}
                                />
                            )}
                        </>
                    )}
                </div>
            </Box>
        </ErrorBoundary>
    );
}

/**
 * Ports the one deliberate optimization from the removed `StatePropsCompareOnUpdateForJobMIxin`:
 * a job in a final status is immutable, so prop churn (e.g. `renderGeneration` bumps) should not
 * re-render it. The mixin's other half — a deep `JSON.stringify` comparison of all props and
 * state — is dropped: it stringified the entire job on every update, and its intended `toJSON`
 * replacer never actually applied (it was passed as `.map`'s `thisArg`, not to `JSON.stringify`).
 *
 * State changes still re-render normally; `memo` only gates prop changes.
 */
function arePropsEqual(prev: JobProps, next: JobProps) {
    return Boolean(
        next.job &&
            prev.job &&
            next.job.isInFinalStatus &&
            next.job.status === prev.job.status &&
            // reload JobDesigner on index change when job.isInFinalStatus=1
            next.index === prev.index &&
            next.isLoading === prev.isLoading,
    );
}

export default memo(Job, arePropsEqual);
