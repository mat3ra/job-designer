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
                id?: string;
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
    /**
     * Fetches a list of projects. Callers that need the results scoped to the current account
     * (e.g. SelectProjectModal) must pass `ownerId` - the webapp's real implementation returns
     * every project accessible to the user (any team/sharing route, not just this account's own)
     * when it's omitted. Stub returns empty list.
     */
    useFetchProjectsList: (listId: string, params?: {
        ownerId?: string;
        limit?: number;
    }) => {
        list: any[];
        loading: boolean;
    } | null;
    /** Opens/closes a Redux-controlled dialog. Stub returns a no-op tuple. */
    useReduxDialog: (dialogType: string) => JobDesignerDialogTuple;
    /** Optional Files explorer component. In standalone, renders nothing. */
    FilesExplorerContainer?: React.ComponentType<any>;
    /**
     * Resolves a message key to localized copy (the webapp wraps TAPi18n).
     * Return undefined for a key you have no translation for — the designer
     * falls back to its English default per key, never shows the key itself.
     * See `src/messages.ts` for the catalogue.
     */
    translate?: (key: string, params?: Record<string, string | number>) => string | undefined;
    /**
     * Records a product event. No-op when absent — see `src/analytics.ts` for the
     * events the guided designer emits and why each one is worth having.
     */
    trackEvent?: (event: string, properties?: Record<string, unknown>) => void;
    /**
     * Optional full-featured page header (the webapp's EntityHeader organism: description
     * toggle/editor, Save & Exit split button, dropdown). When absent, Job renders a minimal
     * header built on cove's EntityHeader (no description support) so standalone still works.
     */
    EntityHeaderComponent?: React.ComponentType<any>;
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