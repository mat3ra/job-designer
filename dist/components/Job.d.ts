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
    get computedEntity(): any;
    get isUsingDatasetTab(): any;
    get isUsingMaterial(): any;
    get isUsingMaterialsTab(): boolean;
    get defaultTab(): any;
    isCurrentTab(tabNameId: any): boolean;
    componentDidMount(): void;
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
    } | {
        isShown: boolean;
        id: string;
        content: string;
        onClick: any;
        icon?: undefined;
    })[];
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
        } | {
            isShown: boolean;
            id: string;
            content: string;
            onClick: any;
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