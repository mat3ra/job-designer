import { type MaterialsSet, type Workflow as WodeWorkflow } from "@mat3ra/wode";
import type { WorkflowProps } from "@mat3ra/workflow-designer";
import React from "react";
export type WorkflowTabProps = Pick<WorkflowProps, "workflow" | "adjustable" | "materials" | "materialsIndex" | "onMaterialSwitch" | "onOutputUpdateRequest" | "dialogs" | "profile" | "publicAccount" | "templates" | "createMetaProperty" | "jobProperties" | "jobHasParent" | "workflowRenderGeneration"> & {
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
export default function WorkflowTab({ id, className, role, workflow, adjustable, materials, materialsSet, materialsIndex, onMaterialSwitch, onJobRender, onWorkflowUpdate, isLoading, iconCls, metaProperties, onOutputUpdateRequest, onIsMultiMaterialChanged, accountUsersIsLoading, accountUsers, dialogs, profile, publicAccount, templates, createMetaProperty, jobProperties, jobHasParent, isDescriptionEditable, workflowRenderGeneration, }: WorkflowTabProps): React.JSX.Element;
//# sourceMappingURL=WorkflowTab.d.ts.map