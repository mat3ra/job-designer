import React from "react";
/**
 * Stub dialog hook result: [open, close] with no-op functions.
 * Matches the ReduxDialogState tuple shape used in wove/workflow-designer.
 */
export type JobDesignerDialogTuple = [() => void, () => void];
/**
 * Hooks and components injected from the webapp at the shell boundary.
 * In standalone mode, each field gets a safe stub implementation.
 */
export interface JobDesignerDeps {
    /** Returns the current user profile. Stub returns a minimal safe profile. */
    useProfile: () => {
        account?: {
            entity?: {
                slug?: string;
            };
        };
        user?: {
            entity?: {
                id?: string;
            };
        };
    };
    /** Fetches a list of materials by list ID + filter params. Stub returns empty state. */
    useFetchMaterialsList: (listId: string, params?: any) => {
        list: any[];
        loading: boolean;
    } | null;
    /** Fetches a list of projects. Stub returns empty list. */
    useFetchProjectsList: (listId: string) => {
        list: any[];
        loading: boolean;
    } | null;
    /** Opens/closes a Redux-controlled dialog. Stub returns a no-op tuple. */
    useReduxDialog: (dialogType: string) => JobDesignerDialogTuple;
    /** Optional Files explorer component. In standalone, renders nothing. */
    FilesExplorerContainer?: React.ComponentType<any>;
    /**
     * Returns the current URL query parameter `tab` if present, or null.
     * In the webapp this reads from Meteor's FlowRouter (Router.current()).
     * In standalone mode the stub returns null so the default tab is used.
     */
    getRouteQueryTab: () => string | null;
}
export declare function JobDesignerProvider({ deps, children, }: {
    deps?: Partial<JobDesignerDeps>;
    children: React.ReactNode;
}): React.JSX.Element;
export declare function useJobDesignerDeps(): JobDesignerDeps;
//# sourceMappingURL=JobDesignerContext.d.ts.map