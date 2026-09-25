/**
 * Mutable dependency slots for job-designer's async job operations (save / submit / terminate).
 *
 * Populated at webapp startup via {@link setAsyncDeps} (called by `setDependencies.ts`).
 * Defaults are no-op stubs suitable for the standalone build.
 *
 * Uses a single mutable object so that reassignment works in both ES module and CommonJS
 * environments (avoids live-binding caveats).
 *
 * Previously `reducers/reducerDeps.js`. The `setIsLoading` slot it used to carry is gone: it
 * existed only so the old impure reducers could re-dispatch a loading action from inside a
 * promise, and loading is now plain component state in `useJobDesignerState`.
 */
export interface JobDesignerAsyncDeps {
    accountsSelector: { currentUser: () => { getAsEntityReference: () => any } };
    createJobAPI: (configs: any[]) => Promise<any>;
    updateJobAPI: (configs: any[]) => Promise<any>;
    /**
     * Navigates away from the designer once a save completes. Takes the saved project and the
     * job's `inSet` rather than a route name/params - the webapp owns all routing concerns
     * (route naming, query-string shape, Meteor Router/FlowRouter), job-designer just reports
     * what was saved.
     */
    redirectAfterSave: (params: { project: any; inSet: any }) => void;
    submitJobAPI: (params: { ids: string[] }) => Promise<any>;
    terminateJobAPI: (params: { ids: string[] }) => Promise<any>;
}

export const asyncDeps: JobDesignerAsyncDeps = {
    accountsSelector: { currentUser: () => ({ getAsEntityReference: () => ({}) }) },
    createJobAPI: async () => {},
    updateJobAPI: async () => {},
    redirectAfterSave: () => {},
    submitJobAPI: async () => {},
    terminateJobAPI: async () => {},
};

/**
 * Inject real webapp implementations.
 * Called from `setDependencies.ts` before any components mount.
 */
export function setAsyncDeps(deps: Record<string, any>) {
    if (deps.AccountsSelector) asyncDeps.accountsSelector = deps.AccountsSelector;
    if (deps.createJob) asyncDeps.createJobAPI = deps.createJob;
    if (deps.updateJob) asyncDeps.updateJobAPI = deps.updateJob;
    if (deps.redirectAfterSave) asyncDeps.redirectAfterSave = deps.redirectAfterSave;
    if (deps.submitJob) asyncDeps.submitJobAPI = deps.submitJob;
    if (deps.terminateJob) asyncDeps.terminateJobAPI = deps.terminateJob;
}
