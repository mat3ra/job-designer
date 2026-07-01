/**
 * Whether `Job` should call `persistJob()` after external Redux/parent props change.
 *
 * When reducers such as `materialsSet` or `jobWorkflowSync` already replaced `props.job`
 * (including `renderJobForDesignerState`), `state.entity` is still the previous job until
 * `setState` flushes. Calling `persistJob()` in that window overwrites Redux with stale data
 * (e.g. drops `{{ material.formula }}` appended by `setJobNameBasedOnMaterials`).
 */
export function shouldPersistJobOnUpdate(prevProps, props) {
    const externalContextChanged =
        prevProps.materials !== props.materials ||
        prevProps.index !== props.index ||
        prevProps.materialsSet !== props.materialsSet ||
        prevProps.metaProperties !== props.metaProperties;

    if (!externalContextChanged) {
        return false;
    }

    const jobReplacedFromRedux = prevProps.job !== props.job;

    return !jobReplacedFromRedux;
}
