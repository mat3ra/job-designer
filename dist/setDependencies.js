import { setReducerDeps } from "./reducers/reducerDeps";
/** Module-level store for imperatively injected deps (webapp compat). */
let _injectedDeps = {};
/**
 * Imperatively inject Meteor/webapp-specific dependencies into job-designer.
 * Called from the webapp's registerDependencies.ts before any components mount.
 *
 * Only the subset matching {@link JobDesignerDeps} is extracted and stored;
 * the remaining webapp-specific props (DAOProvider, store, etc.) are stored in
 * the module-level _injectedDeps for access via getDependency().
 */
export function setDependencies(deps) {
    const mapped = {};
    if (deps.useProfile) {
        mapped.useProfile = deps.useProfile;
    }
    if (deps.useFetchMaterialsList) {
        mapped.useFetchMaterialsList =
            deps.useFetchMaterialsList;
    }
    if (deps.useFetchProjectsList) {
        mapped.useFetchProjectsList =
            deps.useFetchProjectsList;
    }
    if (deps.useReduxDialog) {
        mapped.useReduxDialog = deps.useReduxDialog;
    }
    if (deps.FilesExplorerContainer) {
        mapped.FilesExplorerContainer =
            deps.FilesExplorerContainer;
    }
    if (deps.getRouteQueryParametersFromInSet) {
        // Map old getRouteQueryParametersFromInSet(paramNames) to getRouteQueryTab()
        const getter = deps.getRouteQueryParametersFromInSet;
        mapped.getRouteQueryTab = () => {
            var _a;
            const result = getter(["tab"]);
            return (_a = result === null || result === void 0 ? void 0 : result.tab) !== null && _a !== void 0 ? _a : null;
        };
    }
    _injectedDeps = { ..._injectedDeps, ...deps, ...mapped };
    // Inject webapp-specific deps into JobReducer (createOrUpdate, Router, etc.)
    setReducerDeps(deps);
}
/**
 * Returns the currently injected deps. Used by {@link useJobDesignerDeps} when
 * no JobDesignerProvider is present in the React tree.
 */
export function getInjectedDeps() {
    return _injectedDeps;
}
/**
 * Legacy dependency getter for webapp compatibility.
 * Some webapp containers (e.g. JobGlobalReduxContainer) call this as a global.
 */
export function getDependency(name) {
    if (!_injectedDeps[name]) {
        // Fallback placeholder during standalone testing or initialization
        return () => null;
    }
    return _injectedDeps[name];
}
// Attach to globalThis for webapp compatibility (legacy usage expects a global getDependency)
if (typeof globalThis !== "undefined") {
    globalThis.getDependency = getDependency;
}
