export default Job;
declare class Job {
    constructor(props: any);
    state: any;
    onEntityUpdate: any;
    /**
     * Workflow tab edits mutate wode models in place, then persist via `jobUpdate` (which renders).
     */
    onWorkflowUpdate(workflow: any): void;
    /**
     * Persist in-memory job to Redux; `jobUpdate` runs `job.render()` and bumps `renderGeneration`.
     */
    persistJob(): void;
    /**
     * Something the reader did changed the job. Deliberately called from the
     * handlers rather than from `persistJob()`: that also runs on mount and on
     * entering the Workflow tab, neither of which is an edit, and claiming
     * unsaved changes for them would make the indicator meaningless.
     */
    markUnsavedChanges(): void;
    get computedEntity(): any;
    get isUsingDatasetTab(): any;
    get isUsingMaterial(): any;
    get isUsingMaterialsTab(): boolean;
    get defaultTab(): any;
    isCurrentTab(tabNameId: any): boolean;
    componentDidMount(): void;
    openedAtMs: number;
    /**
     * Browsers ignore custom text here and show their own wording; setting
     * returnValue is what makes the prompt appear at all.
     */
    warnIfLeavingWithUnsavedChanges: (event: any) => string;
    /**
     * Pure derivation - no entity mutation, and in particular no `job.render()`.
     * Recomputed per render rather than memoised: it walks a handful of arrays,
     * whereas caching it would mean tracking invalidation across the same
     * in-place model mutations that already make this component hard to reason
     * about.
     */
    get jobReadiness(): import("../jobReadiness").JobReadiness;
    /** The rail's Review step has no tab of its own; it lands on Compute. */
    onReadinessStepSelect: (stepId: any) => void;
    /**
     * Core-hours the job will consume, and what they cost where the host told us
     * the price. Undefined until nodes, cores and a walltime are all set — the
     * chip is then left out rather than showing a zero the reader would read as
     * "free".
     */
    get estimateLabel(): string;
    openPreflight: () => any;
    closePreflight: () => any;
    /**
     * Read at the moment the checks run rather than captured at render time: the
     * job entity is mutated in place, and the checks must judge what would
     * actually be submitted.
     */
    getPreflightContext: () => {
        job: any;
        materials: any;
        isUsingMaterials: boolean;
        clusterMetadata: any;
        quota: any;
    };
    /** Every unit across the job's subworkflows, in workflow order. */
    get workflowUnits(): any;
    confirmPreflightSubmit: () => void;
    submittedAtMs: number;
    get saveStateInputs(): {
        hasUnsavedChanges: any;
        editable: boolean;
        isSaving: boolean;
    };
    componentDidUpdate(prevProps: any): void;
    componentWillUnmount(): void;
    shouldComponentUpdate(nextProps: any, nextState: any): any;
    onComputeUpdate: (compute: any) => void;
    onDescriptionUpdate: (...args: any[]) => any;
    onNameUpdate: (name: any) => void;
    setParentJob: (parent: any) => void;
    onParentRemove: () => void;
    renderParentJob(): React.JSX.Element;
    getDefaultActions: () => ({
        isShown: any;
        icon: React.JSX.Element;
        id: string;
        content: string;
        onClick: () => void;
    } | {
        isShown: any;
        id: string;
        content: string;
        onClick: () => void;
        icon?: undefined;
    })[];
    /**
     * Persists the entity, then clears the unsaved-changes flag.
     *
     * Both header paths (injected organism and package-native fallback) go
     * through here so the indicator cannot be cleared by one and missed by the
     * other - and so the flag only drops once the save has actually been handed
     * off, not merely requested.
     */
    saveJob(save: any, ...args: any[]): void;
    openTerminateConfirmation: () => any;
    closeTerminateConfirmation: () => any;
    confirmTerminate: () => void;
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
    renderLifecycleTimeline(): React.JSX.Element;
    /**
     * Says whether the job on screen has been persisted. Only while editable:
     * a read-only view has nothing to save, so the words would be noise.
     */
    renderSaveStateIndicator(): React.JSX.Element;
    renderSubmitAction(): React.JSX.Element;
    renderPreflightDialog(): React.JSX.Element;
    renderTerminateConfirmation(): React.JSX.Element;
    getSaveBtnProps(): {
        id: string;
        buttonConfigs: {
            id: string;
            label: string;
            iconName: string;
            onClick: (...args: any[]) => void;
        }[];
        localStorageKey: string;
        isLoading: any;
    };
    getDropdownProps(): {
        isShown: boolean;
        className: string;
        actions: ({
            isShown: any;
            icon: React.JSX.Element;
            id: string;
            content: string;
            onClick: () => void;
        } | {
            isShown: any;
            id: string;
            content: string;
            onClick: () => void;
            icon?: undefined;
        })[];
        buttonContent: string;
    };
    onSelectParentJobSubmit: (ids: any) => Promise<void>;
    onSelectWorkflowsSubmit: (ids: any) => Promise<void>;
    onMaterialsModalSubmit: (materials: any, materialsSet: any) => void;
    openAddMaterialsDialog: () => void;
    openSelectMaterialsDialog: () => void;
    openSelectParentJobDialog: () => void;
    closeSelectParentJobDialog(): void;
    openSelectWorkflowDialog: () => void;
    closeSelectWorkflowDialog: () => void;
    openDatasetUploadsDialog: () => void;
    setCurrentTab: (tabName: any) => void;
    customJobsActions: {
        selectItems: (ids: any) => Promise<void>;
        open: (ids: any) => Promise<void>;
    };
    customWorkflowsActions: {
        selectItems: (ids: any) => Promise<void>;
        open: (ids: any) => Promise<void>;
    };
    render(): React.JSX.Element;
}
import React from "react";
//# sourceMappingURL=Job.d.ts.map