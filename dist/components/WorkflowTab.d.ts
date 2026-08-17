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
    /**
     * Phase 3.3 (@mat3ra/workflow-designer): clicking a unit opens its settings
     * beside the flowchart, and the designer inherits this shell's theme instead
     * of forcing a light one. Ignored by releases predating them.
     */
    useUnitInspector?: boolean;
    useHostTheme?: boolean;
};
export default function WorkflowTab({ id, className, role, workflow, adjustable, materials, materialsSet, materialsIndex, onMaterialSwitch, onJobRender, onWorkflowUpdate, isLoading, iconCls, metaProperties, onOutputUpdateRequest, onIsMultiMaterialChanged, accountUsersIsLoading, accountUsers, dialogs, profile, publicAccount, templates, createMetaProperty, jobProperties, jobHasParent, isDescriptionEditable, workflowRenderGeneration, useUnitInspector, useHostTheme, }: WorkflowTabProps): React.JSX.Element;
//# sourceMappingURL=WorkflowTab.d.ts.map