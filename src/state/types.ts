import type { EntityReference, Job } from "@mat3ra/jode";
import type { OrderedMaterial } from "@mat3ra/wode";

import type { DatasetConfig } from "../components/DatasetTab";

export interface JobDesignerState {
    /** Active material index, shared by `materials` and `workflowContexts`. */
    index: number;
    /**
     * NOTE: this can go stale — `applyMaterialSwitch` updates `index` but not `material`,
     * matching the pre-refactor reducer exactly. Consumers should prefer `materials[index]`
     * (which is what the old `mapStateToProps` passed down, and what `useJobDesignerState`
     * derives).
     */
    material: OrderedMaterial | undefined;
    materials: OrderedMaterial[];
    materialsSet?: EntityReference;
    job: Job;
    /** Deliberately `boolean | undefined`: wode's `Workflow.isMultiMaterial` is `undefined`
     *  (not `false`) for a default workflow, and tests assert strict equality against it. */
    isMultiMaterial: boolean | undefined;
    workflowContexts: Record<string, unknown>[];
    datasetConfig: DatasetConfig;
    /** Bumped to force a re-render: `job` is mutated in place, so its identity never changes. */
    renderGeneration: number;
}
