import type { JobDesignerDeps } from "./JobDesignerContext";
import { setReducerDeps } from "./reducers/reducerDeps";

/** Module-level store for imperatively injected deps (webapp compat). */
let _injectedDeps: Record<string, any> = {};

/**
 * Imperatively inject Meteor/webapp-specific dependencies into job-designer.
 * Called from the webapp's registerDependencies.ts before any components mount.
 *
 * Only the subset matching {@link JobDesignerDeps} is extracted and stored;
 * the remaining webapp-specific props (DAOProvider, store, etc.) are stored in
 * the module-level _injectedDeps for access via getDependency().
 */
export function setDependencies(deps: Record<string, unknown>): void {
    const mapped: Partial<JobDesignerDeps> = {};

    if (deps.useProfile) {
        mapped.useProfile = deps.useProfile as JobDesignerDeps["useProfile"];
    }
    if (deps.useFetchMaterialsList) {
        mapped.useFetchMaterialsList =
            deps.useFetchMaterialsList as JobDesignerDeps["useFetchMaterialsList"];
    }
    if (deps.useFetchProjectsList) {
        mapped.useFetchProjectsList =
            deps.useFetchProjectsList as JobDesignerDeps["useFetchProjectsList"];
    }
    if (deps.useReduxDialog) {
        mapped.useReduxDialog = deps.useReduxDialog as JobDesignerDeps["useReduxDialog"];
    }
    if (deps.FilesExplorerContainer) {
        mapped.FilesExplorerContainer =
            deps.FilesExplorerContainer as JobDesignerDeps["FilesExplorerContainer"];
    }
    if (deps.getRouteQueryParametersFromInSet) {
        // Map old getRouteQueryParametersFromInSet(paramNames) to getRouteQueryTab()
        const getter = deps.getRouteQueryParametersFromInSet as (
            params: string[],
        ) => Record<string, string>;
        mapped.getRouteQueryTab = () => {
            const result = getter(["tab"]);
            return result?.tab ?? null;
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
export function getInjectedDeps(): Partial<JobDesignerDeps> {
    return _injectedDeps as Partial<JobDesignerDeps>;
}

/**
 * Legacy dependency getter for webapp compatibility.
 * Some webapp containers (e.g. JobGlobalReduxContainer) call this as a global.
 */
export function getDependency(name: string): any {
    if (!_injectedDeps[name]) {
        // Fallback placeholder during standalone testing or initialization
        return () => null;
    }
    return _injectedDeps[name];
}

// Attach to globalThis for webapp compatibility (legacy usage expects a global getDependency)
if (typeof globalThis !== "undefined") {
    (globalThis as any).getDependency = getDependency;
}
