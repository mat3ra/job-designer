import setClass from "classnames";
import { Material } from "@mat3ra/made";
import React from "react";

interface MaterialTabProps {
    className: string;
    id: string;
    role: string;
    material: object;
    index: number;
    length: number;
    publicAccount: any;
    profile: any;
    addRemoveAllowed: () => void;
    onUpdateIndex: () => void;
    onMaterialRemove: () => void;
    openAddMaterialsDialog: () => void;
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
}: MaterialTabProps) {
    return (
        <div className={setClass(className)} id={id} role={role}>
            <Material
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
        </div>
    );
}

export default MaterialTab;
