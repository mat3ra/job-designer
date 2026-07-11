import { jsx as _jsx } from "react/jsx-runtime";
import { applySubworkflowUpdateToWorkflow, Workflow } from "@mat3ra/workflow-designer";
import setClass from "classnames";
import { useCallback } from "react";
export default function WorkflowTab({ id, className, role, workflow, adjustable = true, materials, materialsSet, materialsIndex, onMaterialSwitch, onJobRender, onWorkflowUpdate, isLoading, iconCls, metaProperties, onOutputUpdateRequest, onIsMultiMaterialChanged, accountUsersIsLoading, accountUsers, dialogs, profile, publicAccount, templates, createMetaProperty, jobProperties, jobHasParent = false, isDescriptionEditable, workflowRenderGeneration, }) {
    const onSubworkflowUnitUpdate = useCallback((subworkflowOrSchema) => {
        if (!applySubworkflowUpdateToWorkflow(workflow, subworkflowOrSchema, materials !== null && materials !== void 0 ? materials : [], metaProperties)) {
            return;
        }
        onWorkflowUpdate(workflow);
    }, [workflow, onWorkflowUpdate, materials, metaProperties]);
    const onUnitUpdate = useCallback((unit) => {
        const unitIndex = workflow.unitInstances.findIndex((u) => u.flowchartId === unit.flowchartId);
        if (unitIndex >= 0) {
            const nextUnits = [...workflow.unitInstances];
            nextUnits[unitIndex] = unit;
            workflow.setUnits(nextUnits);
            workflow.syncLinkedSubworkflowNameFromUnit(unit);
        }
        onWorkflowUpdate(workflow);
    }, [workflow, onWorkflowUpdate]);
    return (_jsx("div", { className: setClass(className), id: id, role: role, children: _jsx(Workflow, { workflow: workflow, showHeader: true, editable: false, adjustable: adjustable, profile: profile, publicAccount: publicAccount, onSubworkflowUnitUpdate: onSubworkflowUnitUpdate, onUnitUpdate: onUnitUpdate, onIsMultiMaterialChanged: onIsMultiMaterialChanged, materials: materials, materialsSet: materialsSet, materialsIndex: materialsIndex, jobHasParent: jobHasParent, onMaterialSwitch: onMaterialSwitch, onUpdate: onWorkflowUpdate, isLoading: isLoading, iconCls: iconCls, metaProperties: metaProperties, onOutputUpdateRequest: onOutputUpdateRequest, accountUsers: accountUsers, accountUsersIsLoading: accountUsersIsLoading, dialogs: dialogs, templates: templates, createMetaProperty: createMetaProperty, onRender: onJobRender, renderAtJobLevel: true, workflowRenderGeneration: workflowRenderGeneration, isDescriptionEditable: isDescriptionEditable, jobProperties: jobProperties }) }));
}
