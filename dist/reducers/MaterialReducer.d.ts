declare namespace _default {
    export { materialsAdd as MATERIALS_ADD };
    export { materialsRemove as MATERIALS_REMOVE };
    export { materialsUpdateIndex as MATERIALS_UPDATE_INDEX };
    export { materialSwitch as MATERIAL_SWITCH };
    export { materialsSet as MATERIALS_SET };
}
export default _default;
/**
 * @summary Adds materials to job designer's material set:
 */
declare function materialsAdd(state: any, action: any): any;
/**
 * @summary Removes material from materials set:
 */
declare function materialsRemove(state: any, action: any): any;
declare function materialsUpdateIndex(state: any, action: any): any;
/**
 * @summary Handles switching materials in unit input preview.
 */
declare function materialSwitch(state: any, action: any): any;
/**
 * @summary Sets materials + materials set for job designer:
 * - in case of multi-material job updates materials array of job
 * - otherwise generates corresponding workflows array for state.workflows
 */
declare function materialsSet(state: any, action: any, materialsToRetain?: any[], resetWorkflowContexts?: boolean): any;
//# sourceMappingURL=MaterialReducer.d.ts.map