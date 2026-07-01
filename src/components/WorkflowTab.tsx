import { type MaterialsSet, type Workflow as WodeWorkflow } from "@mat3ra/wode";
import type { AnyWorkflowUnit } from "@mat3ra/wode/dist/js/units/factory";
import setClass from "classnames";
import React, { useCallback } from "react";

import type { WorkflowProps } from "@mat3ra/workflow-designer";
import { Workflow } from "@mat3ra/workflow-designer";
import {
    type SubworkflowDesignerUpdate,
    applySubworkflowUpdateToWorkflow,
} from "@mat3ra/workflow-designer";

export type WorkflowTabProps = Pick<
    WorkflowProps,
    | "workflow"
    | "adjustable"
    | "materials"
    | "materialsIndex"
    | "onMaterialSwitch"
    | "onOutputUpdateRequest"
    | "dialogs"
    | "profile"
    | "publicAccount"
    | "templates"
    | "createMetaProperty"
    | "jobProperties"
    | "jobHasParent"
    | "workflowRenderGeneration"
> & {
    id?: string;
    className?: string;
    role?: string;
    onJobRender: () => void;
    onWorkflowUpdate: (workflow: WodeWorkflow) => void;
    isLoading?: boolean;
    iconCls?: string;
    metaProperties: any[];
    materialsSet?: MaterialsSet;
    onIsMultiMaterialChanged?: WorkflowProps["onIsMultiMaterialChanged"];
    accountUsers: any[];
    accountUsersIsLoading: boolean;
    isDescriptionEditable: boolean;
};

export default function WorkflowTab({
    id,
    className,
    role,
    workflow,
    adjustable = true,
    materials,
    materialsSet,
    materialsIndex,
    onMaterialSwitch,
    onJobRender,
    onWorkflowUpdate,
    isLoading,
    iconCls,
    metaProperties,
    onOutputUpdateRequest,
    onIsMultiMaterialChanged,
    accountUsersIsLoading,
    accountUsers,
    dialogs,
    profile,
    publicAccount,
    templates,
    createMetaProperty,
    jobProperties,
    jobHasParent = false,
    isDescriptionEditable,
    workflowRenderGeneration,
}: WorkflowTabProps) {
    const onSubworkflowUnitUpdate = useCallback(
        (subworkflowOrSchema: SubworkflowDesignerUpdate) => {
            if (
                !applySubworkflowUpdateToWorkflow(
                    workflow,
                    subworkflowOrSchema,
                    materials ?? [],
                    metaProperties,
                )
            ) {
                return;
            }
            onWorkflowUpdate(workflow);
        },
        [workflow, onWorkflowUpdate, materials, metaProperties],
    );

    const onUnitUpdate = useCallback(
        (unit: { flowchartId: string }) => {
            const unitIndex = workflow.unitInstances.findIndex(
                (u) => u.flowchartId === unit.flowchartId,
            );
            if (unitIndex >= 0) {
                const nextUnits = [...workflow.unitInstances];
                nextUnits[unitIndex] = unit as (typeof nextUnits)[number];
                workflow.setUnits(nextUnits);
                workflow.syncLinkedSubworkflowNameFromUnit(unit as AnyWorkflowUnit);
            }
            onWorkflowUpdate(workflow);
        },
        [workflow, onWorkflowUpdate],
    );

    return (
        <div className={setClass(className)} id={id} role={role}>
            <Workflow
                workflow={workflow}
                showHeader
                editable={false}
                adjustable={adjustable}
                profile={profile}
                publicAccount={publicAccount}
                onSubworkflowUnitUpdate={onSubworkflowUnitUpdate}
                onUnitUpdate={onUnitUpdate}
                onIsMultiMaterialChanged={onIsMultiMaterialChanged}
                materials={materials}
                materialsSet={materialsSet}
                materialsIndex={materialsIndex}
                jobHasParent={jobHasParent}
                onMaterialSwitch={onMaterialSwitch}
                onUpdate={onWorkflowUpdate}
                isLoading={isLoading}
                iconCls={iconCls}
                metaProperties={metaProperties}
                onOutputUpdateRequest={onOutputUpdateRequest}
                accountUsers={accountUsers}
                accountUsersIsLoading={accountUsersIsLoading}
                dialogs={dialogs}
                templates={templates}
                createMetaProperty={createMetaProperty}
                onRender={onJobRender}
                renderAtJobLevel
                workflowRenderGeneration={workflowRenderGeneration}
                isDescriptionEditable={isDescriptionEditable}
                jobProperties={jobProperties}
            />
        </div>
    );
}
