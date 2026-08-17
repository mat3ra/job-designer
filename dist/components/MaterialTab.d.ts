import React from "react";
/**
 * Props that are forwarded to `MaterialViewerComponent` when it is provided.
 * This allows the injectable viewer to receive all context needed to render
 * an entity header, add/remove controls, navigation index, etc.
 */
export interface MaterialViewerComponentProps {
    material: any;
    index: number;
    length: number;
    publicAccount: any;
    profile: any;
    addRemoveAllowed: boolean | (() => void);
    onUpdateIndex: () => void;
    onRemove: () => void;
    onAdd: () => void;
}
interface MaterialTabProps {
    className: string;
    id: string;
    role: string;
    material: object;
    index: number;
    length: number;
    publicAccount: any;
    profile: any;
    addRemoveAllowed: boolean | (() => void);
    /** Switches the material in the viewer; dispatches `switchMaterialByIndex`. */
    onUpdateIndex: (index: number) => void;
    onMaterialRemove: () => void;
    openAddMaterialsDialog: () => void;
    /**
     * Every material attached to the job, for the tray above the viewer. Optional
     * so hosts that only pass the active material keep working — the tray is then
     * simply not rendered.
     */
    materials?: any[];
    /**
     * Optional injectable material viewer component (e.g. ThreeDEditor from wave.js or a mave component).
     * When provided it receives the full {@link MaterialViewerComponentProps} so that it can render
     * an entity header with add/remove controls, navigation index, etc.
     * Falls back to a plain name display when omitted.
     */
    MaterialViewerComponent?: React.ComponentType<MaterialViewerComponentProps>;
}
declare function MaterialTab({ className, id, role, material, index, length, publicAccount, profile, addRemoveAllowed, onUpdateIndex, onMaterialRemove, openAddMaterialsDialog, materials, MaterialViewerComponent, }: MaterialTabProps): React.JSX.Element;
export default MaterialTab;
//# sourceMappingURL=MaterialTab.d.ts.map