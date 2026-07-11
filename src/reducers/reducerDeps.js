/**
 * Mutable dependency slots for JobReducer.
 *
 * These are populated at webapp startup via setReducerDeps() (called by setDependencies.ts).
 * Defaults are no-op stubs suitable for the standalone build.
 *
 * Uses a single mutable object so that reassignment works in both ES module
 * and CommonJS environments (avoids live-binding caveats).
 */

export const reducerDeps = {
    accountsSelector: { currentUser: () => ({ getAsEntityReference: () => ({}) }) },
    createOrUpdate: async () => {},
    getRouteQueryParametersFromInSet: () => ({}),
    router: { current: () => null, go: () => {} },
    setIsLoading: (value) => ({ type: "IS_LOADING_SET", isLoading: value }),
    submitJobAPI: async () => {},
    terminateJobAPI: async () => {},
};

/**
 * Inject real webapp implementations.
 * Called from setDependencies.ts before any components mount.
 */
export function setReducerDeps(deps) {
    if (deps.AccountsSelector) reducerDeps.accountsSelector = deps.AccountsSelector;
    if (deps.createOrUpdate) reducerDeps.createOrUpdate = deps.createOrUpdate;
    if (deps.getRouteQueryParametersFromInSet)
        reducerDeps.getRouteQueryParametersFromInSet = deps.getRouteQueryParametersFromInSet;
    if (deps.Router) reducerDeps.router = deps.Router;
    if (deps.setIsLoading) reducerDeps.setIsLoading = deps.setIsLoading;
    if (deps.submitJob) reducerDeps.submitJobAPI = deps.submitJob;
    if (deps.terminateJob) reducerDeps.terminateJobAPI = deps.terminateJob;
}
