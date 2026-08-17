/* eslint-disable jsx-a11y/anchor-is-valid */
import IconByName from "@mat3ra/cove/dist/mui/components/icon/IconByName";
import { JobLifecycleTimeline } from "@mat3ra/cove/dist/mui/components/lifecycle/LifecycleTimeline";
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
import { ANALYTICS_EVENTS, durationSince, trackEvent } from "../analytics";
import { estimateComputeUsage, formatEstimate } from "../computeEstimate";
import { formatBlockedReason } from "../jobSubmission";
import { normalizeDialogHandle } from "../dialogHandles";
import { getJobReadiness } from "../jobReadiness";
import { getSaveState, getSaveStateLabel, shouldWarnBeforeLeaving } from "../saveState";
import { shouldPersistJobOnUpdate } from "../shouldPersistJobOnUpdate";
import ComputeTab from "./ComputeTab";
import JobContextStrip from "./JobContextStrip";
import JobReadinessRail from "./JobReadinessRail";
import PreflightDialog from "./PreflightDialog";
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
            isPreflightOpen: false,
            hasSubmitted: false,
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

        // Baseline for "time to first submit". Only for drafts: opening a job that
        // has already run is a different act and would skew the number.
        if (this.state.entity.isInInitialStatus) {
            this.openedAtMs = Date.now();
            trackEvent(ANALYTICS_EVENTS.designerOpened, {
                useGuidedDesigner: Boolean(this.props.useGuidedDesigner),
                startedFromParent: Boolean(this.state.entity.getParentJobClient?.()),
            });
        }
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
            clusterMetadata: this.getPreflightContext().clusterMetadata,
        });
    }

    /**
     * The "Select …" dialog that fills each step.
     *
     * This is what makes the rail a creation path rather than navigation: without
     * it the only way to choose a material or a workflow is still the actions
     * dropdown, which is the thing the rail exists to replace. Review has nothing
     * to choose, so it gets no affordance.
     */
    get readinessStepDialogs() {
        if (!this.state.entity.isInInitialStatus) return {};

        return {
            material: this.openSelectMaterialsDialog,
            dataset: this.openDatasetUploadsDialog,
            workflow: this.openSelectWorkflowDialog,
        };
    }

    /** The rail's Review step has no tab of its own; it lands on Compute. */
    onReadinessStepSelect = (stepId) => {
        // The step a session ends on is where abandonment happens.
        trackEvent(ANALYTICS_EVENTS.stepSelected, { stepId });
        this.setCurrentTab(stepId === "review" ? TAB_NAVIGATION_CONFIG.compute.id : stepId);
    };

    /**
     * Core-hours the job will consume, and what they cost where the host told us
     * the price. Undefined until nodes, cores and a walltime are all set — the
     * chip is then left out rather than showing a zero the reader would read as
     * "free".
     */
    get estimateLabel() {
        const { clusterMetadata } = this.getPreflightContext();
        const runs = this.isUsingMaterialsTab ? this.props.materials?.length ?? 0 : 1;

        return formatEstimate(
            estimateComputeUsage(this.state.entity.compute, clusterMetadata, runs),
        );
    }

    openPreflight = () => this.setState({ isPreflightOpen: true });

    closePreflight = () => this.setState({ isPreflightOpen: false });

    /**
     * Read at the moment the checks run rather than captured at render time: the
     * job entity is mutated in place, and the checks must judge what would
     * actually be submitted.
     */
    getPreflightContext = () => ({
        job: this.state.entity,
        materials: this.props.materials ?? [],
        isUsingMaterials: this.isUsingMaterialsTab,
        // Pricing, limits and quota are not in the job document — the host injects
        // them. Absent, the cost and limit checks report that they cannot judge
        // rather than passing on no evidence.
        clusterMetadata: getInjectedDeps().clusterMetadata ?? this.props.clusterMetadata,
        quota: getInjectedDeps().computeQuota ?? this.props.computeQuota,
    });

    /** Every unit across the job's subworkflows, in workflow order. */
    get workflowUnits() {
        const subworkflows = this.state.entity.workflow?.subworkflows ?? [];

        return subworkflows.flatMap(
            (subworkflow) => subworkflow?.unitsInstances ?? subworkflow?.units ?? [],
        );
    }

    confirmPreflightSubmit = () => {
        // Navigation waits for the status to actually change (see
        // componentDidUpdate). Switching now would land the reader on a Results
        // tab that the conditional tab map has not enabled yet, because the job
        // is still `pre-submission` until the server says otherwise.
        this.submittedAtMs = Date.now();
        this.setState({ isPreflightOpen: false, hasSubmitted: true });
        this.props.onSubmit?.();
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
        // The job the reader just submitted has left their hands; what they want
        // next is to watch it run, not the form they finished with (C2). Fires on
        // the transition rather than on the click, so the monitor is reachable by
        // the time we get there.
        if (this.state.hasSubmitted && !this.props.job.isInInitialStatus) {
            this.setState({ hasSubmitted: false });
            trackEvent(ANALYTICS_EVENTS.jobSubmitted, {
                secondsInDesigner: durationSince(this.openedAtMs),
                useGuidedDesigner: Boolean(this.props.useGuidedDesigner),
            });
            this.setCurrentTab(TAB_NAVIGATION_CONFIG.results.id);
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
            this.state.hasUnsavedChanges !== nextState.hasUnsavedChanges ||
            this.state.isPreflightOpen !== nextState.isPreflightOpen
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
        // Terminating soon after submitting is the proxy for "submitted with the
        // wrong settings" — the thing the estimate and preflight should reduce.
        trackEvent(ANALYTICS_EVENTS.jobTerminated, {
            secondsSinceSubmit: durationSince(this.submittedAtMs),
        });
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
     * Where the job is in its life, in the header.
     *
     * Replaces the status tint on the header icon (`iconCls: text-${statusCls}`),
     * which had one glyph carrying "queued", "running" and "errored" alike and
     * could say nothing about what had already happened or when. On a draft it
     * also does the work of telling a first-time reader what is coming.
     */
    renderLifecycleTimeline() {
        const job = this.state.entity;

        return (
            <JobLifecycleTimeline
                id="job-lifecycle-timeline"
                status={job.status}
                statusTrack={job.statusTrack}
            />
        );
    }

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
        const { editable, onSubmit } = this.props;

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

        // Read from the readiness selector, not from `getSubmitBlockers` directly:
        // it is the one that knows about host-published cluster limits, and a
        // Submit button that stayed enabled over a preflight that refuses would be
        // the designer contradicting itself.
        const blockedReason = formatBlockedReason(this.jobReadiness.blockingReasons);
        // Under the guided designer Submit opens the preflight, which is where the
        // job is actually submitted from. Hosts still on the legacy layout keep
        // today's one-click submit rather than silently gaining a second step.
        const usePreflight = Boolean(this.props.useGuidedDesigner);

        return (
            <Tooltip title={blockedReason ?? ""}>
                {/* span: MUI needs a non-disabled wrapper for the tooltip to fire. */}
                <span>
                    <Button
                        id="job-submit-button"
                        variant="contained"
                        size="small"
                        disabled={Boolean(blockedReason)}
                        onClick={usePreflight ? this.openPreflight : onSubmit}
                    >
                        Submit
                    </Button>
                </span>
            </Tooltip>
        );
    }

    renderPreflightDialog() {
        if (!this.props.useGuidedDesigner) return null;

        return (
            <PreflightDialog
                open={Boolean(this.state.isPreflightOpen)}
                onClose={this.closePreflight}
                getContext={this.getPreflightContext}
                onSubmit={this.confirmPreflightSubmit}
                onGoToStep={this.onReadinessStepSelect}
            />
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
        const { open: openAddMaterialsDialog, close: closeAddMaterialsDialog } =
            normalizeDialogHandle(this.props.jobDialogs.selectMaterialsReduxDialog);

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
        const { open: openSelectMaterialsDialog, close: closeSelectMaterialsDialog } =
            normalizeDialogHandle(this.props.jobDialogs.selectMaterialsReduxDialog);

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
        const { open: openSelectParentJobDialog, close: closeSelectParentJobDialog } =
            normalizeDialogHandle(this.props.jobDialogs.selectParentJobExplorerDialog);

        openSelectParentJobDialog({
            onClose: closeSelectParentJobDialog,
            customActions: this.customJobsActions,
        });
    };

    closeSelectParentJobDialog() {
        const { close: closeSelectParentJobDialog } = normalizeDialogHandle(
            this.props.jobDialogs.selectParentJobExplorerDialog,
        );

        closeSelectParentJobDialog();
    }

    openSelectWorkflowDialog = () => {
        const { open: openSelectWorkflowDialog, close: closeSelectWorkflowDialog } =
            normalizeDialogHandle(this.props.jobDialogs.selectWorkflowReduxDialog);

        openSelectWorkflowDialog({
            onClose: closeSelectWorkflowDialog,
            customActions: this.customWorkflowsActions,
        });
    };

    closeSelectWorkflowDialog = () => {
        const { close: closeSelectWorkflowDialog } = normalizeDialogHandle(
            this.props.jobDialogs.selectWorkflowReduxDialog,
        );

        closeSelectWorkflowDialog();
    };

    openDatasetUploadsDialog = () => {
        const { open: openDatasetUploadsDialog, close: closeDatasetUploadsDialog } =
            normalizeDialogHandle(this.props.jobDialogs.datasetUploadsReduxDialog);

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
                        {this.renderLifecycleTimeline()}
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
                        {this.renderLifecycleTimeline()}
                        {this.renderSaveStateIndicator()}
                        {this.renderSubmitAction()}
                        {headerChildren ?? null}
                    </EntityHeader>
                )}
                {this.renderTerminateConfirmation()}
                {this.renderPreflightDialog()}
                {this.renderParentJob()}
                {this.renderErrors()}
                {this.renderWarnings()}
                {useGuidedDesigner ? (
                    <JobContextStrip
                        steps={readiness.steps}
                        onSelect={this.onReadinessStepSelect}
                        parentJob={parentJobForStrip}
                        onParentRemove={editable ? this.onParentRemove : undefined}
                        estimateLabel={this.estimateLabel}
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
                            onChange={this.readinessStepDialogs}
                            editable={editable}
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
                                        // Phase 3.3 lives in @mat3ra/workflow-designer;
                                        // inert until a release carrying it is installed.
                                        useUnitInspector={useGuidedDesigner}
                                        useHostTheme={useGuidedDesigner}
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
                                        // Phase 2.3 lives in @mat3ra/ive; these are inert
                                        // until a release carrying it is installed.
                                        useComputeCards={useGuidedDesigner}
                                        clusterMetadata={this.getPreflightContext().clusterMetadata}
                                        computeQuota={this.getPreflightContext().quota}
                                        runs={
                                            this.isUsingMaterialsTab
                                                ? Math.max(materials?.length ?? 1, 1)
                                                : 1
                                        }
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
                                        // Phase 3.2 lives in @mat3ra/jove; inert until a
                                        // release carrying it is installed.
                                        showRunMonitor={useGuidedDesigner && !job.isInInitialStatus}
                                        units={this.workflowUnits}
                                        logText={getInjectedDeps().getJobLogTail?.(job)}
                                        hasLogSource={Boolean(getInjectedDeps().getJobLogTail)}
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
