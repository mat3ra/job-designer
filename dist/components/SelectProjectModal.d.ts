import React from "react";
export interface SelectProjectModalProps {
    id?: string;
    title?: string;
    onSubmit: (selectedProject: string) => void;
    onCancel: () => void;
}
declare function SelectProjectModal({ id, title, onSubmit, onCancel, }: SelectProjectModalProps): React.JSX.Element;
export default SelectProjectModal;
//# sourceMappingURL=SelectProjectModal.d.ts.map