import type { EntityReference, Job } from "@mat3ra/jode";
import type { MetaPropertyHolder } from "@mat3ra/prode";
import type { OrderedMaterial } from "@mat3ra/wode";

import type { DatasetConfig } from "../components/DatasetTab";

/** `job.dataset.objectStorageContainerData` (esse, uppercase keys) <-> `DatasetTab`'s `DatasetConfig`. */
export function toDatasetConfig(job: Job): DatasetConfig {
    const containerData = job.dataset?.objectStorageContainerData;

    return {
        name: containerData?.NAME,
        provider: containerData?.PROVIDER,
        region: containerData?.REGION,
        bucket: containerData?.CONTAINER,
    };
}

/**
 * Shared job designer render: `job.render()` → `workflow.render()` → …
 * Used from `jobUpdate` / `jobWorkflowSync` and the material actions.
 */
export function renderJobForDesignerState(
    state: { materials?: OrderedMaterial[]; index?: number; materialsSet?: EntityReference },
    job: Job,
    metaProperties: MetaPropertyHolder[] = [],
) {
    const materials = state.materials || [];
    const materialForRender = materials[state.index ?? 0] ?? materials[0];
    if (!materialForRender || !job.workflowInstance) {
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
