import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from "react";
import { getInjectedDeps } from "./setDependencies";
/** Stub implementations safe for standalone (no Meteor, no Redux store). */
const STANDALONE_JOB_DESIGNER_DEPS = {
    useProfile: () => ({ account: { entity: { slug: "demo" } }, user: { entity: { id: "1" } } }),
    useFetchMaterialsList: () => ({ list: [], loading: false }),
    useFetchProjectsList: () => ({ list: [], loading: false }),
    useReduxDialog: () => [() => { }, () => { }],
    FilesExplorerContainer: undefined,
    getRouteQueryTab: () => null,
};
const DEFAULT_DEPS = STANDALONE_JOB_DESIGNER_DEPS;
const JobDesignerContext = createContext(DEFAULT_DEPS);
export function JobDesignerProvider({ deps, children, }) {
    const value = useMemo(() => ({ ...STANDALONE_JOB_DESIGNER_DEPS, ...deps }), [deps]);
    return _jsx(JobDesignerContext.Provider, { value: value, children: children });
}
export function useJobDesignerDeps() {
    const contextDeps = useContext(JobDesignerContext);
    // When no JobDesignerProvider is in the tree, contextDeps is the DEFAULT_DEPS
    // sentinel. In that case, merge imperatively injected deps from setDependencies().
    if (contextDeps === DEFAULT_DEPS) {
        return { ...DEFAULT_DEPS, ...getInjectedDeps() };
    }
    return contextDeps;
}
