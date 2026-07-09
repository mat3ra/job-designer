import setClass from "classnames";
import React from "react";

// In standalone mode, @mat3ra/made exports the data class (not a React component).
// Render a simple read-only display of the material name as a fallback.
function MaterialNameFallback({ material }: { material: any; [key: string]: any }) {
    const name = material?.name ?? material?.formula ?? "Material";
    return (
        <div style={{ padding: "16px" }}>
            <strong>Material:</strong> {name}
        </div>
    );
}

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
    onUpdateIndex: () => void;
    onMaterialRemove: () => void;
    openAddMaterialsDialog: () => void;
    /**
     * Optional injectable material viewer component (e.g. ThreeDEditor from wave.js or a mave component).
     * When provided it receives the full {@link MaterialViewerComponentProps} so that it can render
     * an entity header with add/remove controls, navigation index, etc.
     * Falls back to a plain name display when omitted.
     */
    MaterialViewerComponent?: React.ComponentType<MaterialViewerComponentProps>;
}

function MaterialTab({
    className,
    id,
    role,
    material,
    index,
    length,
    publicAccount,
    profile,
    addRemoveAllowed,
    onUpdateIndex,
    onMaterialRemove,
    openAddMaterialsDialog,
    MaterialViewerComponent,
}: MaterialTabProps) {
    return (
        <div className={setClass(className)} id={id} role={role} style={{ height: "100%" }}>
            {MaterialViewerComponent ? (
                <MaterialViewerComponent
                    material={material}
                    index={index}
                    length={length}
                    publicAccount={publicAccount}
                    profile={profile}
                    addRemoveAllowed={addRemoveAllowed}
                    onUpdateIndex={onUpdateIndex}
                    onRemove={onMaterialRemove}
                    onAdd={openAddMaterialsDialog}
                />
            ) : (
                <MaterialNameFallback
                    material={material}
                    publicAccount={publicAccount}
                    profile={profile}
                    index={index}
                    length={length}
                    editable={false}
                    addRemoveAllowed={addRemoveAllowed}
                    onUpdateIndex={onUpdateIndex}
                    showHeader
                    showMetadata
                    onRemove={onMaterialRemove}
                    onAdd={openAddMaterialsDialog}
                />
            )}
        </div>
    );
}

export default MaterialTab;
