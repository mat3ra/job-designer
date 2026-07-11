import type { Template } from "@mat3ra/ade";
import type { Job } from "@mat3ra/jode";
import type { ResultsProps } from "@mat3ra/jove";
import React from "react";
interface JobDesignerUser {
    entity: {
        id: string;
        firstName?: string;
        lastName?: string;
        email?: string;
    };
}
interface JobDesignerProfile {
    user: JobDesignerUser;
    personalAccount: JobDesignerAccount;
    account: JobDesignerAccount;
}
interface JobDesignerAccount {
    entity: {
        id: string;
        slug?: string;
        name?: string;
    };
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
    createMetaProperty: (property: JobDesignerCreateMetaPropertyConfig) => Promise<JobDesignerMetaPropertyHolderSchema | undefined>;
    fetchMaterials: (ids: string[]) => Promise<JobDesignerMaterialSchema[]>;
    onMaterialAdd?: (materials: any[], accounts?: any[]) => void;
    onMaterialRemove?: (indices: number[]) => void;
    onDestroy?: () => void;
    getJobMaterialClient?: (job: Job) => Promise<any>;
    /** Optional injectable material viewer component (e.g. ThreeDEditor from wave.js). */
    MaterialViewerComponent?: React.ComponentType<{
        material: any;
    }>;
    /** Optional children rendered in the EntityHeader right slot (selectors, export button, etc.). */
    headerChildren?: React.ReactNode;
    /** Whether the job is editable. */
    editable?: boolean;
}
type JobLocalReduxContainerProps = JobStoreLocalReduxContainerProps & {
    jobMaterials: any[];
    /** Used by `JobGlobalReduxContainer` to build the default job; not read by the local store layer. */
    workflow?: any;
    loadWorkflowEntityById: (workflowId: string) => Promise<any | undefined>;
};
declare function JobLocalReduxContainer(props: JobLocalReduxContainerProps): React.JSX.Element;
declare const _default: React.MemoExoticComponent<typeof JobLocalReduxContainer>;
export default _default;
//# sourceMappingURL=JobLocalReduxContainer.d.ts.map