import type { JobDesignerDeps } from "./JobDesignerContext";
/**
 * Imperatively inject Meteor/webapp-specific dependencies into job-designer.
 * Called from the webapp's registerDependencies.ts before any components mount.
 *
 * Only the subset matching {@link JobDesignerDeps} is extracted and stored;
 * the remaining webapp-specific props (DAOProvider, store, etc.) are stored in
 * the module-level _injectedDeps for access via getDependency().
 */
export declare function setDependencies(deps: Record<string, unknown>): void;
/**
 * Returns the currently injected deps. Used by {@link useJobDesignerDeps} when
 * no JobDesignerProvider is present in the React tree.
 */
export declare function getInjectedDeps(): Partial<JobDesignerDeps>;
/**
 * Legacy dependency getter for webapp compatibility.
 * Some webapp containers (e.g. JobGlobalReduxContainer) call this as a global.
 */
export declare function getDependency(name: string): any;
//# sourceMappingURL=setDependencies.d.ts.map