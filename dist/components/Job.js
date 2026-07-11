import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/* eslint-disable jsx-a11y/anchor-is-valid */
import IconByName from "@exabyte-io/cove.js/dist/mui/components/icon/IconByName";
import { showWarningAlert } from "@exabyte-io/cove.js/dist/other/alerts";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import lodash from "lodash";
import { mix } from "mixwith";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { TAB_NAVIGATION_CONFIG } from "@mat3ra/jode";
import { shouldPersistJobOnUpdate } from "../shouldPersistJobOnUpdate";
import ComputeTab from "./ComputeTab";
import DatasetTab from "./DatasetTab";
import FilesTab from "./FilesTab";
import MaterialTab from "./MaterialTab";
import { StatePropsCompareOnUpdateForJobMIxin } from "./mixins";
import { ResultsTab } from "@mat3ra/jove";
import WorkflowTab from "./WorkflowTab";
import TabsMenu from "@exabyte-io/cove.js/dist/mui/components/tabs/TabsMenu";
import LoadingIndicator from "@exabyte-io/cove.js/dist/mui-composed/components/loading/LoadingIndicator";
import { EntityHeader } from "@exabyte-io/cove.js/dist/mui-composed/components/entity-header/EntityHeader";
import ButtonMultiSelect from "@exabyte-io/cove.js/dist/mui/components/button/ButtonMultiSelect";
import Dropdown from "@exabyte-io/cove.js/dist/mui/components/dropdown/Dropdown";
import { ComputableEntityMixin } from "@mat3ra/ive";
// Webapp-specific mixins/utilities — stubbed for standalone build; injected from webapp at runtime.
const DescriptionUpdateMixin = (superclass) => class extends superclass {
    constructor() {
        super(...arguments);
        this.onDescriptionUpdateGenerator = (entity, postProcessor, callback) => (descriptionObject, description) => {
            entity.descriptionObject = descriptionObject;
            entity.description = description;
            postProcessor(entity, callback);
        };
    }
    // In the webapp this checks user permissions; in standalone always allow editing.
    isDescriptionEditable(_job) {
        return true;
    }
};
const StatefulEntityMixin = (superclass) => class extends superclass {
    // In the webapp this fetches the parent job document from Meteor; no parent in standalone.
    getParentJobClient() {
        return null;
    }
    _resetStateEntityAndUpdateParents(entity, callback) {
        this.setState({ entity: entity || this.state.entity }, () => {
            this.props.onUpdate(this.state.entity);
            if (callback)
                callback();
        });
    }
};
const DAOProvider = { get: () => ({ findByIds: () => [] }) };
const triggerChartsResize = () => { };
const getConditionalTabs = (config, conditionalMap, key) => Object.values(config).filter((tab) => conditionalMap[tab[key]] !== false);
const createMessageTextTAPi18n = (key) => key;
// TODO: resolve the problem with unit output update and make job component deep-comparable again
class Job extends mix(React.Component).with(StatePropsCompareOnUpdateForJobMIxin, StatefulEntityMixin, DescriptionUpdateMixin, ComputableEntityMixin) {
    constructor(props) {
        super(props);
        this.onComputeUpdate = (compute) => {
            const job = this.state.entity;
            job.setCompute(compute);
            this._resetStateEntityAndUpdateParents(job);
        };
        this.onDescriptionUpdate = (...args) => this.onDescriptionUpdateGenerator(this.state.entity, this._resetStateEntityAndUpdateParents, () => {
            // manually trigger state change to update view because of the logic in `shouldComponentUpdateForJob`
            this.setState({
                numberOfDescriptionUpdates: (this.state.numberOfDescriptionUpdates || 0) + 1,
            });
        })(...args);
        this.onNameUpdate = (name) => {
            const job = this.state.entity;
            job.setName(name);
            this._resetStateEntityAndUpdateParents(job);
        };
        this.setParentJob = (parent) => {
            const job = this.state.entity;
            job.setParent(parent);
            this._resetStateEntityAndUpdateParents(job);
        };
        this.onParentRemove = () => {
            const job = this.state.entity;
            job.unsetParent();
            // Workaround to propagate changes to component TODO: figure out how to avoid using forceUpdate
            this._resetStateEntityAndUpdateParents(job);
        };
        this.getDefaultActions = () => {
            const job = this.state.entity;
            const actions = [
                {
                    isShown: job.isInInitialStatus && this.isUsingMaterialsTab,
                    id: "select-material",
                    content: "Select materials",
                    onClick: this.openSelectMaterialsDialog,
                    icon: _jsx(IconByName, { name: "entities.material" }),
                },
                {
                    isShown: job.isInInitialStatus,
                    icon: _jsx(IconByName, { name: "entities.workflow" }),
                    id: "select-workflow",
                    content: "Select workflow",
                    onClick: this.openSelectWorkflowDialog,
                },
                {
                    isShown: job.isInInitialStatus,
                    icon: _jsx(IconByName, { name: "entities.job" }),
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
                {
                    isShown: Boolean(job.id && job.isInInitialStatus),
                    id: "select-submit",
                    content: "Submit",
                    onClick: this.props.onSubmit,
                },
                {
                    isShown: Boolean(job.id && job.isInRunningStatus),
                    id: "select-terminate",
                    content: "Terminate",
                    onClick: this.props.onTerminate,
                },
            ];
            // renders divider if some actions should be shown
            if (actions.some((item) => item.isShown)) {
                actions.push({ isDivider: true, id: "select-divider" });
            }
            return actions;
        };
        this.onSelectParentJobSubmit = async (ids) => {
            const jobs = DAOProvider.get(Job.name).findByIds(ids);
            if (jobs.length > 1) {
                showWarningAlert(createMessageTextTAPi18n("workflow.errors.select.singleOnly"));
                return;
            }
            const parentJob = jobs[0];
            // TODO: figure out how to deal with multimaterial jobs
            const parentMaterials = [await this.props.getJobMaterialClient(parentJob)];
            this.setParentJob(parentJob);
            this.props.onSetMaterials(parentMaterials);
            this.closeSelectParentJobDialog();
        };
        this.onSelectWorkflowsSubmit = async (ids) => {
            if (ids.length !== 1) {
                showWarningAlert(createMessageTextTAPi18n("workflow.errors.select.singleOnly"));
                return;
            }
            this.closeSelectWorkflowDialog();
            this.setState({ isWorkflowLoading: true });
            try {
                await this.props.onWorkflowSelect(ids[0]);
            }
            catch (error) {
                console.error("Failed to load selected workflow", error);
            }
            finally {
                this.setState({ isWorkflowLoading: false });
                this.setCurrentTab(TAB_NAVIGATION_CONFIG.workflow.id);
            }
        };
        this.onMaterialsModalSubmit = (materials, materialsSet) => {
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
        this.openAddMaterialsDialog = () => {
            const [openAddMaterialsDialog, closeAddMaterialsDialog] = this.props.jobDialogs.selectMaterialsReduxDialog;
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
        this.openSelectMaterialsDialog = () => {
            const [openSelectMaterialsDialog, closeSelectMaterialsDialog] = this.props.jobDialogs.selectMaterialsReduxDialog;
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
        this.openSelectParentJobDialog = () => {
            const [openSelectParentJobDialog, closeSelectParentJobDialog] = this.props.jobDialogs.selectParentJobExplorerDialog;
            openSelectParentJobDialog({
                onClose: closeSelectParentJobDialog,
                customActions: this.customJobsActions,
            });
        };
        this.openSelectWorkflowDialog = () => {
            const [openSelectWorkflowDialog, closeSelectWorkflowDialog] = this.props.jobDialogs.selectWorkflowReduxDialog;
            openSelectWorkflowDialog({
                onClose: closeSelectWorkflowDialog,
                customActions: this.customWorkflowsActions,
            });
        };
        this.closeSelectWorkflowDialog = () => {
            const [, closeSelectWorkflowDialog] = this.props.jobDialogs.selectWorkflowReduxDialog;
            closeSelectWorkflowDialog();
        };
        this.openDatasetUploadsDialog = () => {
            const [openDatasetUploadsDialog, closeDatasetUploadsDialog] = this.props.jobDialogs.datasetUploadsReduxDialog;
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
        this.setCurrentTab = (tabName) => {
            triggerChartsResize();
            this.setState({ currentTab: tabName }, () => {
                if (tabName === TAB_NAVIGATION_CONFIG.workflow.id) {
                    this.persistJob();
                }
            });
        };
        this.customJobsActions = {
            selectItems: this.onSelectParentJobSubmit,
            open: this.onSelectParentJobSubmit,
        };
        this.customWorkflowsActions = {
            selectItems: this.onSelectWorkflowsSubmit,
            open: this.onSelectWorkflowsSubmit,
        };
        this.state = {
            ...this.state,
            entity: this.props.job, // make a copy to avoid modifying original object `parentJob`
            currentTab: this.defaultTab,
            isWorkflowLoading: false,
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
        this.props.onUpdate(job);
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
        var _a, _b;
        // handle case when job is not yet loaded and defaultJob is in use
        const job = (_b = (_a = this.state) === null || _a === void 0 ? void 0 : _a.entity) !== null && _b !== void 0 ? _b : this.props.job;
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
        var _a, _b, _c;
        let tab = (_c = (_b = (_a = this.props).getRouteQueryTab) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : null;
        const { job } = this.props;
        if (job.isSubmitted || job.isActive || job.isError) {
            tab = TAB_NAVIGATION_CONFIG.workflow.id;
        }
        else if (job.isInFinalStatus) {
            tab = TAB_NAVIGATION_CONFIG.results.id;
        }
        else if (job.workflow.isUsingDataset) {
            tab = TAB_NAVIGATION_CONFIG.dataset.id;
        }
        else if (this.isUsingMaterial) {
            tab = TAB_NAVIGATION_CONFIG.material.id;
        }
        return tab || TAB_NAVIGATION_CONFIG.workflow.id;
    }
    isCurrentTab(tabNameId) {
        return this.state.currentTab === tabNameId;
    }
    componentDidMount() {
        this.persistJob();
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
        this.props.onDestroy();
    }
    shouldComponentUpdate(nextProps, nextState) {
        return (this.shouldComponentUpdateForJob(nextProps, nextState) ||
            this.shouldComponentUpdateFromComputableEntityMixin(nextProps, nextState) ||
            this.state.currentTab !== nextState.currentTab ||
            this.state.isWorkflowLoading !== nextState.isWorkflowLoading);
    }
    renderParentJob() {
        var _a, _b;
        const parentJob = (_b = (_a = this.state.entity).getParentJobClient) === null || _b === void 0 ? void 0 : _b.call(_a);
        return parentJob ? (_jsx(Alert, { severity: "info", onClose: this.props.editable ? this.onParentRemove : undefined, children: _jsxs("div", { className: "search-pill-selected", children: ["Parent job:", " ", _jsx("b", { children: _jsx("a", { href: "", onClick: parentJob.open, children: parentJob.name }) }), " ", "from\u00A0", _jsx("b", { children: parentJob._project.slug }), " project"] }) })) : null;
    }
    getSaveBtnProps() {
        const job = this.state.entity;
        const isDesignerLoading = this.props.isLoading || this.state.isWorkflowLoading;
        return {
            id: "save-button",
            buttonConfigs: [
                {
                    id: "save",
                    label: "Save",
                    iconName: "shapes.save",
                    onClick: (...args) => {
                        this._resetStateEntityAndUpdateParents(job, () => this.props.onSave(...args));
                    },
                },
            ],
            localStorageKey: "job-designer-save-button",
            isLoading: isDesignerLoading,
        };
    }
    getDropdownProps() {
        return {
            isShown: true,
            className: "pull-right action-dropdown",
            actions: this.getDefaultActions(),
            buttonContent: "Select Job Actions",
        };
    }
    closeSelectParentJobDialog() {
        const [, closeSelectParentJobDialog] = this.props.jobDialogs.selectParentJobExplorerDialog;
        closeSelectParentJobDialog();
    }
    render() {
        var _a;
        const { editable, isLoading, hideDescription, material, index, length, onUpdateIndex, onMaterialRemove, datasetConfig, allowedWorkflows, onWorkflowSelect, materials, materialsSet, metaProperties, onIsMultiMaterialChanged, onMaterialSwitch, onOutputUpdateRequest, clusters, profile, accountUsers, accountUsersIsLoading, workflowDialogs, publicAccount, project, templates, resultsProperties, jobProperties, createMetaProperty, fetchMaterials, renderGeneration, MaterialViewerComponent, 
        /** Optional children rendered in the right side of the EntityHeader (selectors, export button, etc.). */
        headerChildren, } = this.props;
        const currentAccount = profile.account.entity;
        const currentUser = profile.user.entity;
        const job = this.state.entity;
        // TODO: refactor for modularity
        // consider advanced options useful only for workflows that contain espresso
        const allApps = job.workflow.usedApplications;
        const showAdvancedCompute = allApps.length > 0
            ? allApps.map((a) => a.hasAdvancedComputeOptions).reduce((x, y) => x && y)
            : false;
        const isCurrentTabWorkflow = this.isCurrentTab(TAB_NAVIGATION_CONFIG.workflow.id);
        const isCurrentTabMaterial = this.isCurrentTab(TAB_NAVIGATION_CONFIG.material.id);
        const isCurrentTabDataset = this.isCurrentTab(TAB_NAVIGATION_CONFIG.dataset.id);
        const isCurrentTabResults = this.isCurrentTab(TAB_NAVIGATION_CONFIG.results.id);
        const isCurrentTabFiles = this.isCurrentTab(TAB_NAVIGATION_CONFIG.files.id);
        const isCurrentTabCompute = this.isCurrentTab(TAB_NAVIGATION_CONFIG.compute.id);
        const conditionalTabsMap = {
            [TAB_NAVIGATION_CONFIG.material.id]: this.isUsingMaterialsTab && Boolean(this.props.material),
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
        const isDescriptionEditable = this.isDescriptionEditable(job);
        const isDesignerLoading = isLoading || this.state.isWorkflowLoading;
        const isActive = (value) => (value ? "active" : null);
        return (_jsxs(ErrorBoundary, { fallback: _jsx("div", {}), children: [_jsxs(EntityHeader, { name: job.name, editable: this.props.editable, onNameUpdate: this.onNameUpdate, isLoading: isDesignerLoading, subtitle: (project === null || project === void 0 ? void 0 : project.name) ? { project: project.name } : undefined, icon: "entities.job", id: "job-designer-header", children: [this.props.editable && _jsx(ButtonMultiSelect, { ...this.getSaveBtnProps() }), _jsx(Dropdown, { ...this.getDropdownProps() }), headerChildren !== null && headerChildren !== void 0 ? headerChildren : null] }), this.renderParentJob(), this.renderErrors(), this.renderWarnings(), _jsx(TabsMenu, { tabs: tabs, activeTabIndex: activeTabIndex, variant: "fullWidth", centered: true }), _jsx(Box, { children: _jsx("div", { className: "tab-content", children: this.state.isWorkflowLoading ? (_jsx(LoadingIndicator, { included: true })) : (_jsxs(_Fragment, { children: [isCurrentTabMaterial && (_jsx(MaterialTab, { className: isCurrentTabMaterial ? "active" : null, id: TAB_NAVIGATION_CONFIG.material.id, publicAccount: publicAccount, profile: profile, role: "tabpanel", material: material, index: index, length: length, onUpdateIndex: onUpdateIndex, onMaterialRemove: onMaterialRemove, addRemoveAllowed: !job.id, openAddMaterialsDialog: this.openAddMaterialsDialog, MaterialViewerComponent: MaterialViewerComponent })), isCurrentTabDataset && (_jsx(DatasetTab, { className: isCurrentTabDataset ? "active" : null, id: TAB_NAVIGATION_CONFIG.dataset.id, profile: profile, role: "tabpanel", datasetConfig: datasetConfig, datagridHeaderText: "DataFrame", datagridPopoverText: "Training Model Data" })), isCurrentTabWorkflow && (_jsx(WorkflowTab, { className: isCurrentTabWorkflow ? "active" : null, workflowRenderGeneration: renderGeneration, id: TAB_NAVIGATION_CONFIG.workflow.id, role: "tabpanel", workflow: job.workflow, onJobRender: this.persistJob, jobHasParent: Boolean((_a = job.getParentJobClient) === null || _a === void 0 ? void 0 : _a.call(job)), profile: profile, publicAccount: publicAccount, allowedWorkflows: allowedWorkflows, onWorkflowSelect: onWorkflowSelect, materials: materials, materialsSet: materialsSet, materialsIndex: index, onIsMultiMaterialChanged: onIsMultiMaterialChanged, onMaterialSwitch: onMaterialSwitch, onWorkflowUpdate: this.onWorkflowUpdate, adjustable: job.isInInitialStatus, iconCls: `text-${job.statusCls}`, metaProperties: metaProperties, onOutputUpdateRequest: onOutputUpdateRequest, accountUsers: accountUsers, accountUsersIsLoading: accountUsersIsLoading, dialogs: workflowDialogs, templates: templates, createMetaProperty: createMetaProperty, jobProperties: jobProperties, isDescriptionEditable: isDescriptionEditable })), isCurrentTabCompute && (_jsx(ComputeTab, { className: isCurrentTabCompute ? "active" : null, id: TAB_NAVIGATION_CONFIG.compute.id, role: "tabpanel", compute: job.compute, job: job, onUpdate: this.onComputeUpdate, editable: editable, clusters: clusters, showAdvancedOptions: showAdvancedCompute, accountUsers: accountUsers, accountUsersIsLoading: accountUsersIsLoading, currentUser: currentUser, currentAccount: currentAccount })), isCurrentTabResults && (_jsx(ResultsTab, { className: `jobs-view ${isActive(isCurrentTabResults)}`, id: TAB_NAVIGATION_CONFIG.results.id, role: "tabpanel", job: job, material: material, publicAccount: publicAccount, profile: profile, resultsProperties: resultsProperties, jobProperties: jobProperties, fetchMaterials: fetchMaterials })), isCurrentTabFiles && (_jsx(FilesTab, { className: `jobs-view ${isActive(isCurrentTabFiles)}`, id: TAB_NAVIGATION_CONFIG.files.id, role: "tabpanel", job: job }))] })) }) })] }));
    }
}
export default Job;
