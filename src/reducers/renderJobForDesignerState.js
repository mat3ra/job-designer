/**
 * Shared job designer render: `job.render()` → `workflow.render()` → …
 * Used from `jobUpdate` / `jobWorkflowSync` and material reducers.
 */
export function renderJobForDesignerState(state, job, metaProperties = []) {
    const materials = state.materials || [];
    const materialForRender = materials[state.index] ?? materials[0];
    if (!materialForRender || !job?.workflowInstance) {
        return job;
    }

    job.workflowInstance.updateMethodData(materials, metaProperties);
    job.setMaterial(materialForRender);
    job.setMaterials(materials);
    if (state.materialsSet) {
        job.setMaterialsSet(state.materialsSet);
    }
    job.render();

    return job;
}
