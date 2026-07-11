import { applySubworkflowUpdateToWorkflow, isWodeSubworkflowInstance, } from "@mat3ra/workflow-designer/dist/utils/subworkflowDesignerUpdate";
/** @deprecated Use {@link applySubworkflowUpdateToWorkflow} from `subworkflowDesignerUpdate.ts`. */
export function syncSubworkflowSchemaOnWorkflow(workflow, subworkflowSchema) {
    return applySubworkflowUpdateToWorkflow(workflow, subworkflowSchema, [], []);
}
export { applySubworkflowUpdateToWorkflow, isWodeSubworkflowInstance, };
