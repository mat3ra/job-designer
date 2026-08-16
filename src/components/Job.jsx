/* eslint-disable jsx-a11y/anchor-is-valid */
import IconByName from "@mat3ra/cove/dist/mui/components/icon/IconByName";
import { showWarningAlert } from "@mat3ra/cove/dist/other/alerts";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import lodash from "lodash";
import { mix } from "mixwith";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { TAB_NAVIGATION_CONFIG } from "@mat3ra/jode";
import { getSubmitBlockedReason } from "../jobSubmission";
import { getJobReadiness } from "../jobReadiness";
import { getSaveState, getSaveStateLabel, shouldWarnBeforeLeaving } from "../saveState";
import { shouldPersistJobOnUpdate } from "../shouldPersistJobOnUpdate";
import ComputeTab from "./ComputeTab";
import JobContextStrip from "./JobContextStrip";
import JobReadinessRail from "./JobReadinessRail";
import DatasetTab from "./DatasetTab";
import FilesTab from "./FilesTab";
import MaterialTab from "./MaterialTab";
import { StatePropsCompareOnUpdateForJobMIxin } from "./mixins";
import { ResultsTab } from "@mat3ra/jove";
import WorkflowTab from "./WorkflowTab";
import { getInjectedDeps } from "../setDependencies";

import TabsMenu from "@mat3ra/cove/dist/mui/components/tabs/TabsMenu";
import LoadingIndicator from "@mat3ra/cove/dist/mui-composed/components/loading/LoadingIndicator";
import { EntityHeader } from "@mat3ra/cove/dist/mui-composed/components/entity-header/EntityHeader";
import ButtonMultiSelect from "@mat3ra/cove/dist/mui/components/button/ButtonMultiSelect";
import Dropdown from "@mat3ra/cove/dist/mui/components/dropdown/Dropdown";
import { ComputableEntityMixin } from "@mat3ra/ive";

// Webapp-specific mixins/utilities — stubbed for standalone build; injected from webapp at runtime.
const DescriptionUpdateMixin = (superclass) =>
    class extends superclass {
        // In the webapp this checks user permissions; in standalone always allow editing.
        isDescriptionEditable(_job) {
            return true;
        }

        onDescriptionUpdateGenerator =
            (entity, postProcessor, callback) => (descriptionObject, description) => {
                entity.descriptionObject = descriptionObject;
                entity.description = description;
                postProcessor(entity, callback);
            };
    };

const StatefulEntityMixin = (superclass) =>
    class extends superclass {
        // In the webapp this fetches the parent job document from Meteor; no parent in standalone.
        getParentJobClient() {
            return null;
        }

        _resetStateEntityAndUpdateParents(entity, callback) {
            this.setState({ entity: entity || this.state.entity }, () => {
                this.props.onUpdate(this.state.entity);
                if (callback) callback();
            });
        }
    };
// Resolved lazily (not at module load) so it picks up the real webapp DAOProvider
// injected via setDependencies(), which runs after this module is first imported.
const getDAOProvider = () =>
    getInjectedDeps().DAOProvider ?? { get: () => ({ findByIds: () => [] }) };
// Same lazy-resolution pattern: pulls host-app file helpers already registered via
// setDependencies() for forwarding into ResultsTab (see the render() method below).
const getFileUtils = () => {
    const deps = getInjectedDeps();
    return {
        downloadAndProcessFile: deps.downloadAndProcessFile,
        handleGetSignedURL: deps.handleGetSignedURL,
        handleGetSignedUrlAsCSV: deps.handleGetSignedUrlAsCSV,
    };
};
const triggerChartsResize = () => {};
const getConditionalTabs = (config, conditionalMap, key) =>
    Object.values(config).filter((tab) => conditionalMap[tab[key]] !== false);
const createMessageTextTAPi18n = (key) => key;

/**
 * Shown when the designer throws while rendering.
 *
 * The fallback used to be `<div />`: a render error produced a silently blank
 * page, with nothing to report and no way back. Anything the reader can act on
 * beats an empty screen, so this names what happened and offers a reload; the
 * digest is there to be pasted into a bug report.
 */
function JobDesignerErrorCard({ error, resetErrorBoundary }) {
    return (
        <Box p={3}>
            <Alert
                severity="error"
                action={
                    <Button color="inherit" size="small" onClick={resetErrorBoundary}>
                        Reload designer
                    </Button>
                }
            >
                <AlertTitle>This job could not be displayed</AlertTitle>
                Something in the designer failed to render. Your saved job is unaffected — reloading
                usually clears it. If it keeps happening, include this with a report:
                <Box
                    component="code"
                    sx={{
                        display: "block",
                        mt: 1,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: "action.hover",
                        fontSize: "0.75rem",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                    }}
                >
                    {error?.message ?? String(error)}
                </Box>
            </Alert>
        </Box>
    );
}

// TODO: resolve the problem with unit output update and make job component deep-comparable again
class Job extends mix(React.Component).with(
    StatePropsCompareOnUpdateForJobMIxin,
    StatefulEntityMixin,
    DescriptionUpdateMixin,
    ComputableEntityMixin,
) {
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            entity: this.props.job, // make a copy to avoid modifying original object `parentJob`
            currentTab: this.defaultTab,
            isWorkflowLoading: false,
            isTerminateConfirmationOpen: false,
            hasUnsavedChanges: false,
        };
        this.onEntityUpdate = this.props.onUpdate;
        this.onWorkflowUpdate = this.onWorkflowUpdate.bind(this);
        this.persistJob = this.persistJob.bind(this);
    }

    /**
     * Persist in-memory job to Redux; `jobUpdate` runs `job.render()` and bumps `renderGeneration`.
     */
    persistJob() {
        this.props.onUpdate(this.state.entity);
    }

    /**
     * Workflow tab edits mutate wode models in place, then persist via `jobUpdate` (which renders).
     */
    onWorkflowUpdate(workflow) {
        const job = this.state.entity;
        job.setWorkflow(workflow);
        this.markUnsavedChanges();
        this.props.onUpdate(job);
    }

    /**
     * Something the reader did changed the job. Deliberately called from the
     * handlers rather than from `persistJob()`: that also runs on mount and on
     * entering the Workflow tab, neither of which is an edit, and claiming
     * unsaved changes for them would make the indicator meaningless.
     */
    markUnsavedChanges() {
        if (!this.state.hasUnsavedChanges) this.setState({ hasUnsavedChanges: true });
    }

    get computedEntity() {
        return this.state.entity;
    }

    /*
    Controls whether the dataset tab is actually displayed, true if the workflow has the isUsingDataset key set to true.
    @returns {boolean}
     */
    get isUsingDatasetTab() {
        return this.state.entity.workflow.isUsingDataset || false;
    }

    get isUsingMaterial() {
        // handle case when job is not yet loaded and defaultJob is in use
        const job = this.state?.entity ?? this.props.job;

        return job.workflow.subworkflows.some((subworkflow) => {
            return ["vasp", "nwchem", "espresso"].includes(subworkflow.application.name);
        });
    }

    /*
    Controls whether the materials tab is actually displayed
    @returns {boolean}
     */
    get isUsingMaterialsTab() {
        // NOTE: TB tmp disabled `isUsingMaterial` logic above to show the materials tab for old jobs/workflows
        return !this.isUsingDatasetTab; // && this.isUsingMaterial;
    }

    get defaultTab() {
        let tab = this.props.getRouteQueryTab?.() ?? null;
        const { job } = this.props;
        if (job.isSubmitted || job.isActive || job.isError) {
            tab = TAB_NAVIGATION_CONFIG.workflow.id;
        } else if (job.isInFinalStatus) {
            tab = TAB_NAVIGATION_CONFIG.results.id;
        } else if (job.workflow.isUsingDataset) {
            tab = TAB_NAVIGATION_CONFIG.dataset.id;
        } else if (this.isUsingMaterial) {
            tab = TAB_NAVIGATION_CONFIG.material.id;
        }

        return tab || TAB_NAVIGATION_CONFIG.workflow.id;
    }

    isCurrentTab(tabNameId) {
        return this.state.currentTab === tabNameId;
    }

    componentDidMount() {
        this.persistJob();
        window.addEventListener("beforeunload", this.warnIfLeavingWithUnsavedChanges);
    }

    /**
     * Browsers ignore custom text here and show their own wording; setting
     * returnValue is what makes the prompt appear at all.
     */
    warnIfLeavingWithUnsavedChanges = (event) => {
        if (!shouldWarnBeforeLeaving(this.saveStateInputs)) return undefined;

        event.preventDefault();
        event.returnValue = "";
        return "";
    };

    /**
     * Pure derivation - no entity mutation, and in particular no `job.render()`.
     * Recomputed per render rather than memoised: it walks a handful of arrays,
     * whereas caching it would mean tracking invalidation across the same
     * in-place model mutations that already make this component hard to reason
     * about.
     */
    get jobReadiness() {
        return getJobReadiness({
            job: this.state.entity,
            materials: this.props.materials ?? [],
            isUsingMaterials: this.isUsingMaterialsTab,
            datasetConfig: this.props.datasetConfig,
            editable: Boolean(this.props.editable),
        });
    }

    /** The rail's Review step has no tab of its own; it lands on Compute. */
    onReadinessStepSelect = (stepId) => {
        this.setCurrentTab(stepId === "review" ? TAB_NAVIGATION_CONFIG.compute.id : stepId);
    };

    get saveStateInputs() {
        return {
            hasUnsavedChanges: this.state.hasUnsavedChanges,
            editable: Boolean(this.props.editable),
            isSaving: Boolean(this.props.isLoading),
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.job !== this.props.job) {
            this.setState({ entity: this.props.job });
        }
        if (shouldPersistJobOnUpdate(prevProps, this.props)) {
            this.persistJob();
        }
    }

    componentWillUnmount() {
        window.removeEventListener("beforeunload", this.warnIfLeavingWithUnsavedChanges);
        this.props.onDestroy();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            this.shouldComponentUpdateForJob(nextProps, nextState) ||
            this.shouldComponentUpdateFromComputableEntityMixin(nextProps, nextState) ||
            this.state.currentTab !== nextState.currentTab ||
            this.state.isWorkflowLoading !== nextState.isWorkflowLoading ||
            // Without this the confirmation never appears: the mixins below only
            // consider the job entity, so a state change this component owns is
            // invisible to them and the render is skipped.
            this.state.isTerminateConfirmationOpen !== nextState.isTerminateConfirmationOpen ||
            this.state.hasUnsavedChanges !== nextState.hasUnsavedChanges
        );
    }

    onComputeUpdate = (compute) => {
        const job = this.state.entity;
        job.setCompute(compute);
        this.markUnsavedChanges();
        this._resetStateEntityAndUpdateParents(job);
    };

    onDescriptionUpdate = (...args) =>
        this.onDescriptionUpdateGenerator(
            this.state.entity,
            this._resetStateEntityAndUpdateParents,
            () => {
                // manually trigger state change to update view because of the logic in `shouldComponentUpdateForJob`
                this.setState({
                    numberOfDescriptionUpdates: (this.state.numberOfDescriptionUpdates || 0) + 1,
                });
            },
        )(...args);

    onNameUpdate = (name) => {
        const job = this.state.entity;
        job.setName(name);
        this.markUnsavedChanges();
        this._resetStateEntityAndUpdateParents(job);
    };

    setParentJob = (parent) => {
        const job = this.state.entity;
        job.setParent(parent);
        this.markUnsavedChanges();
        this._resetStateEntityAndUpdateParents(job);
    };

    onParentRemove = () => {
        const job = this.state.entity;
        job.unsetParent();
        this.markUnsavedChanges();
        // Workaround to propagate changes to component TODO: figure out how to avoid using forceUpdate
        this._resetStateEntityAndUpdateParents(job);
    };

    renderParentJob() {
        // The context strip carries the parent as a chip; two of them is one too many.
        if (this.props.useGuidedDesigner) return null;

        const parentJob = this.state.entity.getParentJobClient?.();
        return parentJob ? (
            <Alert severity="info" onClose={this.props.editable ? this.onParentRemove : undefined}>
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
    }

    getDefaultActions = () => {
        const job = this.state.entity;
        const actions = [
            {
                isShown: job.isInInitialStatus && this.isUsingMaterialsTab,
                id: "select-material",
                content: "Select materials",
                onClick: this.openSelectMaterialsDialog,
                icon: <IconByName name="entities.material" />,
            },
            {
                isShown: job.isInInitialStatus,
                icon: <IconByName name="entities.workflow" />,
                id: "select-workflow",
                content: "Select workflow",
                onClick: this.openSelectWorkflowDialog,
            },
            {
                isShown: job.isInInitialStatus,
                icon: <IconByName name="entities.job" />,
                id: "select-parent-job",
                content: "Select parent",
                onClick: this.openSelectParentJobDialog,
            },
            {
                // TODO: not covered by design icon to be added
                isShown: job.isInInitialStatus && this.isUsingDatasetTab,
                id: "select-dataset",
                content: "Select dataset",
                onClick: this.openDatasetUploadsDialog,
            },
            // Submit and Terminate deliberately do NOT live here any more: they are
            // the two actions the whole screen exists to reach, and a menu item that
            // silently disappears when the job is not ready tells the reader nothing.
            // They are header buttons now - see renderSubmitAction().
        ];

        // renders divider if some actions should be shown
        if (actions.some((item) => item.isShown)) {
            actions.push({ isDivider: true, id: "select-divider" });
        }

        return actions;
    };

    /**
     * Persists the entity, then clears the unsaved-changes flag.
     *
     * Both header paths (injected organism and package-native fallback) go
     * through here so the indicator cannot be cleared by one and missed by the
     * other - and so the flag only drops once the save has actually been handed
     * off, not merely requested.
     */
    saveJob(save, ...args) {
        this._resetStateEntityAndUpdateParents(this.state.entity, () => {
            save(...args);
            this.setState({ hasUnsavedChanges: false });
        });
    }

    openTerminateConfirmation = () => this.setState({ isTerminateConfirmationOpen: true });

    closeTerminateConfirmation = () => this.setState({ isTerminateConfirmationOpen: false });

    confirmTerminate = () => {
        this.closeTerminateConfirmation();
        this.props.onTerminate();
    };

    /**
     * Submit and Terminate as header buttons rather than dropdown items.
     *
     * A disabled Submit says what is missing instead of vanishing, which is what
     * the dropdown did. Terminate asks first - it kills a running job, and it
     * used to be a single unconfirmed click.
     */
    /**
     * Says whether the job on screen has been persisted. Only while editable:
     * a read-only view has nothing to save, so the words would be noise.
     */
    renderSaveStateIndicator() {
        if (!this.props.editable) return null;

        const saveState = getSaveState(this.saveStateInputs);

        return (
            <Typography
                id="job-save-state"
                variant="caption"
                color={saveState === "unsaved" ? "warning.main" : "text.secondary"}
                sx={{ whiteSpace: "nowrap" }}
            >
                {getSaveStateLabel(saveState)}
            </Typography>
        );
    }

    renderSubmitAction() {
        const job = this.state.entity;
        const { editable, materials, onSubmit } = this.props;

        if (!editable) return null;

        if (job.isInRunningStatus) {
            return (
                <Button
                    id="job-terminate-button"
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={this.openTerminateConfirmation}
                >
                    Terminate
                </Button>
            );
        }

        if (!job.isInInitialStatus) return null;

        const blockerOptions = {
            job,
            materials: materials ?? [],
            isUsingMaterials: this.isUsingMaterialsTab,
        };
        const blockedReason = getSubmitBlockedReason(blockerOptions);

        return (
            <Tooltip title={blockedReason ?? ""}>
                {/* span: MUI needs a non-disabled wrapper for the tooltip to fire. */}
                <span>
                    <Button
                        id="job-submit-button"
                        variant="contained"
                        size="small"
                        disabled={Boolean(blockedReason)}
                        onClick={onSubmit}
                    >
                        Submit
                    </Button>
                </span>
            </Tooltip>
        );
    }

    renderTerminateConfirmation() {
        const job = this.state.entity;

        return (
            <Dialog
                open={Boolean(this.state.isTerminateConfirmationOpen)}
                onClose={this.closeTerminateConfirmation}
            >
                <DialogTitle>Terminate this job?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <b>{job.name}</b> is still running. Terminating stops it where it is;
                        results produced so far are kept, but the run cannot be resumed.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.closeTerminateConfirmation}>Keep running</Button>
                    <Button color="error" variant="contained" onClick={this.confirmTerminate}>
                        Terminate
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    getSaveBtnProps() {
        const isDesignerLoading = this.props.isLoading || this.state.isWorkflowLoading;
        return {
            id: "save-button",
            buttonConfigs: [
                {
                    id: "save",
                    label: "Save",
                    // "actions.save" is the real map entry (MUI Save); "shapes.save" doesn't
                    // exist in cove's IconByName map and fell back to a plain Circle glyph.
                    iconName: "actions.save",
                    onClick: (...args) => {
                        // NOTE: read `this.state.entity` at click time rather than closing over a
                        // `job` local captured at render time. `ButtonMultiSelect` snapshots
                        // `buttonConfigs[0]` into its own local state on mount (and does not
                        // resync it on prop changes), so it keeps calling the *first* onClick
                        // closure it ever received for the whole lifetime of the component. If
                        // that closure captured a `job` variable by value, it would forever
                        // persist the entity as it was on the very first render (e.g. the
                        // original auto-generated job, before any parent/workflow/materials
                        // selection or rename) — silently reverting all later edits on Save.
                        this.saveJob((...saveArgs) => this.props.onSave(...saveArgs), ...args);
                    },
                },
            ],
            localStorageKey: "job-designer-save-button",
            isLoading: isDesignerLoading,
        };
    }

    getDropdownProps() {
        const actions = this.getDefaultActions();
        // Collapse separators with no visible action after them (e.g. the trailing group
        // divider when nothing follows) - otherwise the menu renders a dangling divider line.
        const hasVisibleActionAfter = (index) =>
            actions
                .slice(index + 1)
                .some((action) => !action.isDivider && action.isShown !== false);
        const cleanedActions = actions.filter(
            (action, index) => !action.isDivider || hasVisibleActionAfter(index),
        );
        return {
            isShown: cleanedActions.some((action) => !action.isDivider && action.isShown !== false),
            className: "pull-right action-dropdown",
            actions: cleanedActions,
            buttonContent: "Select Job Actions",
        };
    }

    onSelectParentJobSubmit = async (ids) => {
        // Entity DAO key is the string "Job"; do not use this React class's .name -
        // build tools may mangle/shorten class names during minification
        // (ports mat3ra/web-app#2928, SOF-7962).
        const jobs = getDAOProvider().get("Job").findByIds(ids);

        if (jobs.length > 1) {
            showWarningAlert(createMessageTextTAPi18n("workflow.errors.select.singleOnly"));
            return;
        }

        const parentJob = jobs[0];
        if (!parentJob) {
            // DAO lookup miss for a job the user just picked from a loaded list (e.g. a stale
            // cache) - getJobMaterialClient's own contract expects a real Job, not undefined.
            console.error("onSelectParentJobSubmit: no Job entity found for the selected id(s)");
            return;
        }
        // TODO: figure out how to deal with multimaterial jobs
        const parentMaterials = [await this.props.getJobMaterialClient(parentJob)];
        this.setParentJob(parentJob);
        this.props.onSetMaterials(parentMaterials);
        this.closeSelectParentJobDialog();
    };

    onSelectWorkflowsSubmit = async (ids) => {
        if (ids.length !== 1) {
            showWarningAlert(createMessageTextTAPi18n("workflow.errors.select.singleOnly"));
            return;
        }

        this.closeSelectWorkflowDialog();
        this.setState({ isWorkflowLoading: true });
        try {
            await this.props.onWorkflowSelect(ids[0]);
        } catch (error) {
            console.error("Failed to load selected workflow", error);
        } finally {
            this.setState({ isWorkflowLoading: false });
            this.setCurrentTab(TAB_NAVIGATION_CONFIG.workflow.id);
        }
    };

    onMaterialsModalSubmit = (materials, materialsSet) => {
        const job = this.state.entity;
        // for new or multimaterial jobs - add materials
        if (materials.length > 1 && job.id && !this.props.isMultiMaterial) {
            // otherwise - throw error re-using generic message for workflows
            showWarningAlert(createMessageTextTAPi18n("workflow.errors.select.singleOnly"));
            return;
        }
        this.props.onSetMaterials(materials, materialsSet);
        this.setCurrentTab(TAB_NAVIGATION_CONFIG.material.id);
    };

    openAddMaterialsDialog = () => {
        const [openAddMaterialsDialog, closeAddMaterialsDialog] =
            this.props.jobDialogs.selectMaterialsReduxDialog;

        openAddMaterialsDialog({
            id: "material-add",
            title: "Import materials",
            onClose: closeAddMaterialsDialog,
            omitEntitySelection: false,
            selectionLimit: 0,
            onSubmit: (materials) => {
                this.props.onMaterialAdd(materials, this.props.profile.accounts);
                closeAddMaterialsDialog();
            },
        });
    };

    openSelectMaterialsDialog = () => {
        const [openSelectMaterialsDialog, closeSelectMaterialsDialog] =
            this.props.jobDialogs.selectMaterialsReduxDialog;

        openSelectMaterialsDialog({
            title: "Select Materials",
            onClose: closeSelectMaterialsDialog,
            omitEntitySelection: false,
            selectionLimit: 0,
            onSubmit: (materials, materialsSet) => {
                this.onMaterialsModalSubmit(materials, materialsSet);
                closeSelectMaterialsDialog();
            },
        });
    };

    openSelectParentJobDialog = () => {
        const [openSelectParentJobDialog, closeSelectParentJobDialog] =
            this.props.jobDialogs.selectParentJobExplorerDialog;

        openSelectParentJobDialog({
            onClose: closeSelectParentJobDialog,
            customActions: this.customJobsActions,
        });
    };

    closeSelectParentJobDialog() {
        const [, closeSelectParentJobDialog] = this.props.jobDialogs.selectParentJobExplorerDialog;

        closeSelectParentJobDialog();
    }

    openSelectWorkflowDialog = () => {
        const [openSelectWorkflowDialog, closeSelectWorkflowDialog] =
            this.props.jobDialogs.selectWorkflowReduxDialog;

        openSelectWorkflowDialog({
            onClose: closeSelectWorkflowDialog,
            customActions: this.customWorkflowsActions,
        });
    };

    closeSelectWorkflowDialog = () => {
        const [, closeSelectWorkflowDialog] = this.props.jobDialogs.selectWorkflowReduxDialog;

        closeSelectWorkflowDialog();
    };

    openDatasetUploadsDialog = () => {
        const [openDatasetUploadsDialog, closeDatasetUploadsDialog] =
            this.props.jobDialogs.datasetUploadsReduxDialog;

        openDatasetUploadsDialog({
            onClose: closeDatasetUploadsDialog,
            account: this.props.profile.account.entity,
            itemClickCallback: (dataset) => {
                this.props.onSetDataset(dataset);
                closeDatasetUploadsDialog();
            },
            selectItemsCallback: (datasetConfigs) => {
                if (datasetConfigs.length > 1) {
                    showWarningAlert(createMessageTextTAPi18n("workflow.errors.select.singleOnly"));
                    return;
                }
                const dataset = datasetConfigs[0];
                this.props.onSetDataset(dataset);
                closeDatasetUploadsDialog();
                this.setCurrentTab(TAB_NAVIGATION_CONFIG.dataset.id);
            },
        });
    };

    setCurrentTab = (tabName) => {
        triggerChartsResize();
        this.setState({ currentTab: tabName }, () => {
            if (tabName === TAB_NAVIGATION_CONFIG.workflow.id) {
                this.persistJob();
            }
        });
    };

    customJobsActions = {
        selectItems: this.onSelectParentJobSubmit,
        open: this.onSelectParentJobSubmit,
    };

    customWorkflowsActions = {
        selectItems: this.onSelectWorkflowsSubmit,
        open: this.onSelectWorkflowsSubmit,
    };

    render() {
        const {
            editable,
            isLoading,
            hideDescription,
            material,
            index,
            length,
            onUpdateIndex,
            onMaterialRemove,
            datasetConfig,
            allowedWorkflows,
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
            /** Optional children rendered in the right side of the EntityHeader (selectors, export button, etc.). */
            headerChildren,
        } = this.props;

        const currentAccount = profile.account.entity;
        const currentUser = profile.user.entity;

        const job = this.state.entity;
        // TODO: refactor for modularity
        // consider advanced options useful only for workflows that contain espresso
        const allApps = job.workflow.usedApplications;
        const showAdvancedCompute =
            allApps.length > 0
                ? allApps.map((a) => a.hasAdvancedComputeOptions).reduce((x, y) => x && y)
                : false;
        const isCurrentTabWorkflow = this.isCurrentTab(TAB_NAVIGATION_CONFIG.workflow.id);
        const isCurrentTabMaterial = this.isCurrentTab(TAB_NAVIGATION_CONFIG.material.id);
        const isCurrentTabDataset = this.isCurrentTab(TAB_NAVIGATION_CONFIG.dataset.id);
        const isCurrentTabResults = this.isCurrentTab(TAB_NAVIGATION_CONFIG.results.id);
        const isCurrentTabFiles = this.isCurrentTab(TAB_NAVIGATION_CONFIG.files.id);
        const isCurrentTabCompute = this.isCurrentTab(TAB_NAVIGATION_CONFIG.compute.id);

        const conditionalTabsMap = {
            [TAB_NAVIGATION_CONFIG.material.id]:
                this.isUsingMaterialsTab && Boolean(this.props.material),
            [TAB_NAVIGATION_CONFIG.dataset.id]: this.isUsingDatasetTab,
            [TAB_NAVIGATION_CONFIG.results.id]: !job.isInInitialStatus,
            [TAB_NAVIGATION_CONFIG.files.id]: !job.isInInitialStatus,
        };

        const tabsToRender = getConditionalTabs(TAB_NAVIGATION_CONFIG, conditionalTabsMap, "id");

        const tabs = tabsToRender.map((tab) => {
            return {
                ...tab,
                onClick: () => this.setCurrentTab(tab.id),
            };
        });

        const activeTabIndex = tabsToRender.findIndex((item) => item.id === this.state.currentTab);

        // Phase 2 layout is opt-in per host so the webapp and the demo can flip
        // independently; the legacy tab strip stays until parity is verified.
        const useGuidedDesigner = Boolean(this.props.useGuidedDesigner);
        const readiness = this.jobReadiness;
        const parentJobClient = job.getParentJobClient?.();
        const parentJobForStrip = parentJobClient
            ? { name: parentJobClient.name, projectSlug: parentJobClient._project?.slug }
            : null;

        const isDescriptionEditable = this.isDescriptionEditable(job);
        const isDesignerLoading = isLoading || this.state.isWorkflowLoading;
        const dropdownProps = this.getDropdownProps();

        const isActive = (value) => (value ? "active" : null);

        // The webapp injects its full EntityHeader organism (description toggle/editor,
        // Save & Exit split button) for production parity; standalone falls back to a
        // minimal header built on cove's EntityHeader below.
        const InjectedEntityHeader = getInjectedDeps().EntityHeaderComponent;

        return (
            <ErrorBoundary FallbackComponent={JobDesignerErrorCard}>
                {InjectedEntityHeader ? (
                    <InjectedEntityHeader
                        name={job.name}
                        editable={this.props.editable}
                        onNameUpdate={this.onNameUpdate}
                        isLoading={isDesignerLoading}
                        subtitle={project?.name ? { project: project.name } : undefined}
                        description={job.description}
                        icon="entities.job"
                        iconCls={`text-${job.statusCls}`}
                        id="job-designer-header"
                        saveBtnProps={{
                            isShown: Boolean(this.props.editable),
                            isLoading: isDesignerLoading,
                            // Read `this.state.entity` at call time (not a render-time `job`
                            // capture): the organism's ButtonMultiSelect snapshots its configs
                            // on mount, so a captured entity would forever persist the very
                            // first render's state - see getSaveBtnProps for the full note.
                            onSave: (omitRedirect) =>
                                this.saveJob(
                                    (redirectFlag) => this.props.onSave(redirectFlag),
                                    omitRedirect,
                                ),
                        }}
                        dropdownProps={dropdownProps}
                        descriptionEditorTitle="Job Description"
                        isDescriptionEditorHidden={hideDescription}
                        item={job}
                        isDescriptionEditable={isDescriptionEditable}
                        onDescriptionUpdate={this.onDescriptionUpdate}
                    >
                        {this.renderSaveStateIndicator()}
                        {this.renderSubmitAction()}
                        {headerChildren ?? null}
                    </InjectedEntityHeader>
                ) : (
                    <EntityHeader
                        name={job.name}
                        editable={this.props.editable}
                        onNameUpdate={this.onNameUpdate}
                        isLoading={isDesignerLoading}
                        subtitle={project?.name ? { project: project.name } : undefined}
                        icon="entities.job"
                        id="job-designer-header"
                    >
                        {/* Actions dropdown to the left of Save, matching the pre-extraction
                            header (EntityHeader organism rendered Dropdown -> Pager -> Save).
                            Hidden when no action is currently shown - otherwise it opens an
                            empty menu. */}
                        {dropdownProps.isShown && <Dropdown {...dropdownProps} />}
                        {this.props.editable && <ButtonMultiSelect {...this.getSaveBtnProps()} />}
                        {this.renderSaveStateIndicator()}
                        {this.renderSubmitAction()}
                        {headerChildren ?? null}
                    </EntityHeader>
                )}
                {this.renderTerminateConfirmation()}
                {this.renderParentJob()}
                {this.renderErrors()}
                {this.renderWarnings()}
                {useGuidedDesigner ? (
                    <JobContextStrip
                        steps={readiness.steps}
                        onSelect={this.onReadinessStepSelect}
                        parentJob={parentJobForStrip}
                        onParentRemove={editable ? this.onParentRemove : undefined}
                    />
                ) : null}
                {useGuidedDesigner ? null : (
                    <TabsMenu
                        tabs={tabs}
                        activeTabIndex={activeTabIndex}
                        variant="fullWidth"
                        centered
                    />
                )}
                <Box
                    sx={
                        useGuidedDesigner
                            ? {
                                  display: "grid",
                                  gridTemplateColumns: { xs: "1fr", md: "auto minmax(0, 1fr)" },
                                  alignItems: "start",
                              }
                            : undefined
                    }
                >
                    {useGuidedDesigner ? (
                        <JobReadinessRail
                            steps={readiness.steps}
                            activeStepId={
                                this.state.currentTab === TAB_NAVIGATION_CONFIG.compute.id &&
                                readiness.isSubmittable
                                    ? TAB_NAVIGATION_CONFIG.compute.id
                                    : this.state.currentTab
                            }
                            onSelect={this.onReadinessStepSelect}
                        />
                    ) : null}
                    <div className="tab-content">
                        {this.state.isWorkflowLoading ? (
                            <LoadingIndicator included />
                        ) : (
                            <>
                                {isCurrentTabMaterial && (
                                    <MaterialTab
                                        className={isCurrentTabMaterial ? "active" : null}
                                        id={TAB_NAVIGATION_CONFIG.material.id}
                                        publicAccount={publicAccount}
                                        profile={profile}
                                        role="tabpanel"
                                        material={material}
                                        index={index}
                                        length={length}
                                        onUpdateIndex={onUpdateIndex}
                                        materials={materials}
                                        onMaterialRemove={onMaterialRemove}
                                        addRemoveAllowed={!job.id}
                                        openAddMaterialsDialog={this.openAddMaterialsDialog}
                                        MaterialViewerComponent={MaterialViewerComponent}
                                    />
                                )}
                                {isCurrentTabDataset && (
                                    <DatasetTab
                                        className={isCurrentTabDataset ? "active" : null}
                                        id={TAB_NAVIGATION_CONFIG.dataset.id}
                                        profile={profile}
                                        role="tabpanel"
                                        datasetConfig={datasetConfig}
                                        datagridHeaderText="DataFrame"
                                        datagridPopoverText="Training Model Data"
                                    />
                                )}
                                {isCurrentTabWorkflow && (
                                    <WorkflowTab
                                        className={isCurrentTabWorkflow ? "active" : null}
                                        workflowRenderGeneration={renderGeneration}
                                        id={TAB_NAVIGATION_CONFIG.workflow.id}
                                        role="tabpanel"
                                        workflow={job.workflow}
                                        onJobRender={this.persistJob}
                                        jobHasParent={Boolean(job.getParentJobClient?.())}
                                        profile={profile}
                                        publicAccount={publicAccount}
                                        allowedWorkflows={allowedWorkflows}
                                        onWorkflowSelect={onWorkflowSelect}
                                        materials={materials}
                                        materialsSet={materialsSet}
                                        materialsIndex={index}
                                        onIsMultiMaterialChanged={onIsMultiMaterialChanged}
                                        onMaterialSwitch={onMaterialSwitch}
                                        onWorkflowUpdate={this.onWorkflowUpdate}
                                        adjustable={job.isInInitialStatus}
                                        iconCls={`text-${job.statusCls}`}
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
                                        className={isCurrentTabCompute ? "active" : null}
                                        id={TAB_NAVIGATION_CONFIG.compute.id}
                                        role="tabpanel"
                                        compute={job.compute}
                                        job={job}
                                        onUpdate={this.onComputeUpdate}
                                        editable={editable}
                                        clusters={clusters}
                                        showAdvancedOptions={showAdvancedCompute}
                                        accountUsers={accountUsers}
                                        accountUsersIsLoading={accountUsersIsLoading}
                                        currentUser={currentUser}
                                        currentAccount={currentAccount}
                                    />
                                )}
                                {isCurrentTabResults && (
                                    <ResultsTab
                                        className={`jobs-view ${isActive(isCurrentTabResults)}`}
                                        id={TAB_NAVIGATION_CONFIG.results.id}
                                        role="tabpanel"
                                        job={job}
                                        material={material}
                                        publicAccount={publicAccount}
                                        profile={profile}
                                        resultsProperties={resultsProperties}
                                        jobProperties={jobProperties}
                                        fetchMaterials={fetchMaterials}
                                        MaterialComponent={MaterialViewerComponent}
                                        fileUtils={getFileUtils()}
                                        DataGridComponent={getInjectedDeps().DataGridComponent}
                                    />
                                )}
                                {isCurrentTabFiles && (
                                    <FilesTab
                                        className={`jobs-view ${isActive(isCurrentTabFiles)}`}
                                        id={TAB_NAVIGATION_CONFIG.files.id}
                                        role="tabpanel"
                                        job={job}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </Box>
            </ErrorBoundary>
        );
    }
}

export default Job;
