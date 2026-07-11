/**
 * Inject real webapp implementations.
 * Called from setDependencies.ts before any components mount.
 */
export function setReducerDeps(deps: any): void;
export namespace reducerDeps {
    namespace accountsSelector {
        function currentUser(): {
            getAsEntityReference: () => {};
        };
    }
    function createOrUpdate(): Promise<void>;
    function getRouteQueryParametersFromInSet(): {};
    namespace router {
        function current(): any;
        function go(): void;
    }
    function setIsLoading(value: any): {
        type: string;
        isLoading: any;
    };
    function submitJobAPI(): Promise<void>;
    function terminateJobAPI(): Promise<void>;
}
//# sourceMappingURL=reducerDeps.d.ts.map