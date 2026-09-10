import React, { createContext, useContext, useMemo } from "react";

import { getInjectedDeps } from "./setDependencies";

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
        account?: { entity?: { id?: string; slug?: string } };
        user?: { entity?: { id?: string } };
    };
    /** Fetches a list of materials by list ID + filter params. Stub returns empty state. */
    useFetchMaterialsList: (
        listId: string,
        params?: any,
    ) => { list: any[]; loading: boolean } | null;
    /**
     * Fetches a list of projects. Callers that need the results scoped to the current account
     * (e.g. SelectProjectModal) must pass `ownerId` - the webapp's real implementation returns
     * every project accessible to the user (any team/sharing route, not just this account's own)
     * when it's omitted. Stub returns empty list.
     */
    useFetchProjectsList: (
        listId: string,
        params?: { ownerId?: string; limit?: number },
    ) => { list: any[]; loading: boolean } | null;
    /** Opens/closes a Redux-controlled dialog. Stub returns a no-op tuple. */
    useReduxDialog: (dialogType: string) => JobDesignerDialogTuple;
    /** Optional Files explorer component. In standalone, renders nothing. */
    FilesExplorerContainer?: React.ComponentType<any>;
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
    /**
     * Legacy DAO lookup for the "select parent job" dialog (`Job`'s `onSelectParentJobSubmit`).
     * Optional and unstubbed in standalone - that flow is unreachable there anyway, since the
     * demo passes no-op dialog tuples.
     */
    DAOProvider?: { get: (key: string) => { findByIds: (ids: string[]) => any[] } };
    /**
     * File-download helpers forwarded to `@mat3ra/jove`'s `ResultsTab` (`fileUtils` prop) -
     * signatures copied from its own (unexported) `ResultsTabProps`, not invented here.
     */
    downloadAndProcessFile?: (
        accountId: string,
        fileConfig: any,
        onSuccess: (contents: string, fileMetadata: any) => void,
        handler: (files: any[], onLoad: any) => void,
    ) => void;
    handleGetSignedURL?: (files: any[], onLoad: any) => void;
    handleGetSignedUrlAsCSV?: (files: any[], onLoad: any) => void;
    /** Forwarded to `ResultsTab`'s `DataGridComponent` prop, typed `React.ComponentType<any>` there. */
    DataGridComponent?: React.ComponentType<any>;
}

/** Stub implementations safe for standalone (no Meteor, no Redux store). */
const STANDALONE_JOB_DESIGNER_DEPS: JobDesignerDeps = {
    useProfile: () => ({
        account: { entity: { id: "1", slug: "demo" } },
        user: { entity: { id: "1" } },
    }),
    useFetchMaterialsList: () => ({ list: [], loading: false }),
    useFetchProjectsList: () => ({ list: [], loading: false }),
    useReduxDialog: () => [() => {}, () => {}],
    FilesExplorerContainer: undefined,
    getRouteQueryTab: () => null,
};

const DEFAULT_DEPS = STANDALONE_JOB_DESIGNER_DEPS;
const JobDesignerContext = createContext<JobDesignerDeps>(DEFAULT_DEPS);

export function JobDesignerProvider({
    deps,
    children,
}: {
    deps?: Partial<JobDesignerDeps>;
    children: React.ReactNode;
}) {
    const value = useMemo(() => ({ ...STANDALONE_JOB_DESIGNER_DEPS, ...deps }), [deps]);
    return <JobDesignerContext.Provider value={value}>{children}</JobDesignerContext.Provider>;
}

export function useJobDesignerDeps(): JobDesignerDeps {
    const contextDeps = useContext(JobDesignerContext);
    // When no JobDesignerProvider is in the tree, contextDeps is the DEFAULT_DEPS
    // sentinel. In that case, merge imperatively injected deps from setDependencies().
    if (contextDeps === DEFAULT_DEPS) {
        return { ...DEFAULT_DEPS, ...getInjectedDeps() };
    }
    return contextDeps;
}
