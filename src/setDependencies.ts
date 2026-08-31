import type { JobDesignerDeps } from "./JobDesignerContext";
import { setAsyncDeps } from "./state/asyncDeps";

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
    if (deps.EntityHeaderComponent || deps.EntityHeader) {
        // The webapp has always injected its EntityHeader organism under the `EntityHeader`
        // key (a compat shim nothing consumed until now) - accept both spellings.
        mapped.EntityHeaderComponent = (deps.EntityHeaderComponent ||
            deps.EntityHeader) as JobDesignerDeps["EntityHeaderComponent"];
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

    // Inject webapp-specific deps for the async job operations (createJob, updateJob, Router, etc.)
    setAsyncDeps(deps);
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

declare global {
    // `var` is required syntax for ambient global declarations (not a real hoisted variable);
    // both rules below are false positives against that TS-specific meaning.
    // eslint-disable-next-line no-var, vars-on-top
    var getDependency: (name: string) => any;
}

// Attach to globalThis for webapp compatibility (legacy usage expects a global getDependency)
if (typeof globalThis !== "undefined") {
    globalThis.getDependency = getDependency;
}
