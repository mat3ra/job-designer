import type { Job } from "@mat3ra/jode";
import type { MetaPropertyHolder } from "@mat3ra/prode";
import type { OrderedMaterial } from "@mat3ra/wode";

import type { JobDesignerState } from "./types";
import { toDatasetConfig } from "./utils";

export function initialJobDesignerState(
    job: Job,
    materials: OrderedMaterial[] = [],
    metaProperties: MetaPropertyHolder[] = [],
): JobDesignerState {
    const datasetConfig = toDatasetConfig(job);

    job.workflowInstance?.updateMethodData(materials, metaProperties);

    const materialForRender = materials[0];
    if (materialForRender && job.workflowInstance) {
        job.setMaterials(materials);
        job.setMaterial(materialForRender);
    }

    return {
        index: 0,
        material: materials[0],
        materials,
        materialsSet: job.materialsSet,
        job,
        // Preserved verbatim rather than coerced with Boolean(): `Workflow.isMultiMaterial` is
        // `undefined` for a default workflow, and coercing it to `false` breaks strict-equality
        // assertions against the workflow's own value.
        isMultiMaterial: job.workflowInstance?.isMultiMaterial,
        workflowContexts: materials.map(() => ({})),
        datasetConfig,
        renderGeneration: 0,
    };
}
