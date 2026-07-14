/**
 * Dedicated React-Redux context for job-designer's own local, per-job store.
 *
 * JobLocalReduxContainer mounts its local store under a <Provider> nested inside the
 * webapp's app-wide <Provider>. Using the default react-redux context there would shadow
 * the outer store for any webapp-injected component rendered as a descendant (e.g.
 * FilesExplorerContainer, which reads global state like state.files via plain
 * useSelector/useDispatch) — those hooks would resolve against this local store instead
 * and crash reading slices that don't exist on it. A dedicated context keeps job-designer's
 * internal store lookups isolated from the default context, so unrelated components bubble
 * up to the real outer store as expected.
 */
export declare const JobDesignerReduxContext: import("react").Context<any>;
export declare const useJobDesignerDispatch: () => import("redux").Dispatch<import("redux").AnyAction>;
export declare const useJobDesignerSelector: <Selected extends unknown>(selector: (state: any) => Selected, equalityFn?: (previous: Selected, next: Selected) => boolean) => Selected;
//# sourceMappingURL=JobDesignerReduxContext.d.ts.map