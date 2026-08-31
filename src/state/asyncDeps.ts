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
    getRouteQueryParametersFromInSet: (inSet: any) => Record<string, any>;
    router: { current: () => any; go: (route: string, params?: any, options?: any) => void };
    submitJobAPI: (params: { ids: string[] }) => Promise<any>;
    terminateJobAPI: (params: { ids: string[] }) => Promise<any>;
}

export const asyncDeps: JobDesignerAsyncDeps = {
    accountsSelector: { currentUser: () => ({ getAsEntityReference: () => ({}) }) },
    createJobAPI: async () => {},
    updateJobAPI: async () => {},
    getRouteQueryParametersFromInSet: () => ({}),
    router: { current: () => null, go: () => {} },
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
    if (deps.getRouteQueryParametersFromInSet)
        asyncDeps.getRouteQueryParametersFromInSet = deps.getRouteQueryParametersFromInSet;
    if (deps.Router) asyncDeps.router = deps.Router;
    if (deps.submitJob) asyncDeps.submitJobAPI = deps.submitJob;
    if (deps.terminateJob) asyncDeps.terminateJobAPI = deps.terminateJob;
}
