import Box from "@mui/material/Box";
import setClass from "classnames";
import React from "react";

import MaterialMetadataPanel from "./MaterialMetadataPanel";
import MaterialsTray from "./MaterialsTray";

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
    materials,
    MaterialViewerComponent,
}: MaterialTabProps) {
    const trayMaterials = materials?.length ? materials : material ? [material] : [];

    return (
        <div className={setClass(className)} id={id} role={role} style={{ height: "100%" }}>
            <MaterialsTray
                materials={trayMaterials}
                activeIndex={index}
                onSelect={onUpdateIndex}
                onRemove={onMaterialRemove}
                onAdd={openAddMaterialsDialog}
                editable={Boolean(addRemoveAllowed)}
            />
            {/* Viewer and metadata side by side: the structure is the subject, the
                facts about it are what a reader checks before spending core-hours. */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(240px, 300px)" },
                    gap: 2,
                    p: 2,
                    alignItems: "start",
                }}
            >
                <Box sx={{ minWidth: 0 }}>
                    {MaterialViewerComponent ? (
                        <MaterialViewerComponent
                            material={material}
                            index={index}
                            length={length}
                            publicAccount={publicAccount}
                            profile={profile}
                            addRemoveAllowed={addRemoveAllowed}
                            onUpdateIndex={onUpdateIndex as unknown as () => void}
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
                </Box>
                <MaterialMetadataPanel material={material} />
            </Box>
        </div>
    );
}

export default MaterialTab;
