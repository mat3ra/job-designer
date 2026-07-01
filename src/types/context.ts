export interface JobDesignerUser {
    entity: { id: string; firstName?: string; lastName?: string; email?: string };
}

export interface JobDesignerProfile {
    user: JobDesignerUser;
    personalAccount: JobDesignerAccount;
    account: JobDesignerAccount;
}

export interface JobDesignerAccount {
    entity: { id: string; slug?: string; name?: string };
}

export interface JobDesignerCluster {
    name: string;
    slug?: string;
    [key: string]: unknown;
}

export interface JobDesignerMetaProperty {
    [key: string]: unknown;
}

export interface JobDesignerProperty {
    [key: string]: unknown;
}

export interface JobDesignerDialogState {
    isOpen: boolean;
    open: (...args: any[]) => void;
    close: () => void;
}

export interface JobDesignerMaterialSchema {
    [key: string]: unknown;
}

export interface JobDesignerMetaPropertyHolderSchema {
    [key: string]: unknown;
}

export interface JobDesignerCreateMetaPropertyConfig {
    [key: string]: unknown;
}
