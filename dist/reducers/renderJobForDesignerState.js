/**
 * Shared job designer render: `job.render()` → `workflow.render()` → …
 * Used from `jobUpdate` / `jobWorkflowSync` and material reducers.
 */
export function renderJobForDesignerState(state, job, metaProperties = []) {
    var _a;
    const materials = state.materials || [];
    const materialForRender = (_a = materials[state.index]) !== null && _a !== void 0 ? _a : materials[0];
    if (!materialForRender || !(job === null || job === void 0 ? void 0 : job.workflow)) {
        return job;
    }
    job.workflow.updateMethodData(materials, metaProperties);
    job.setMaterial(materialForRender);
    job.setMaterials(materials);
    if (state.materialsSet) {
        job.setMaterialsSet(state.materialsSet);
    }
    job.render();
    return job;
}
