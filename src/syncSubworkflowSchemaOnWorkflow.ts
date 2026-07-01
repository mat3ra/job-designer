import type { SubworkflowSchema } from "@mat3ra/esse/dist/js/types";
import type { Workflow as WodeWorkflow } from "@mat3ra/wode";

import {
    type SubworkflowDesignerUpdate,
    applySubworkflowUpdateToWorkflow,
    isWodeSubworkflowInstance,
} from "@mat3ra/workflow-designer/src/utils/subworkflowDesignerUpdate";

/** @deprecated Use {@link applySubworkflowUpdateToWorkflow} from `subworkflowDesignerUpdate.ts`. */
export function syncSubworkflowSchemaOnWorkflow(
    workflow: WodeWorkflow,
    subworkflowSchema: SubworkflowSchema,
): boolean {
    return applySubworkflowUpdateToWorkflow(workflow, subworkflowSchema, [], []);
}

export {
    applySubworkflowUpdateToWorkflow,
    isWodeSubworkflowInstance,
    type SubworkflowDesignerUpdate,
};
