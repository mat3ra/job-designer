import { useJobDesignerDeps } from "../../JobDesignerContext";

export default function useJobReduxDialogs() {
    const { useReduxDialog } = useJobDesignerDeps();
    const selectWorkflowReduxDialog = useReduxDialog("SelectWorkflowExplorer");
    const datasetUploadsReduxDialog = useReduxDialog("DatasetUploadsExplorer");
    const selectParentJobExplorerDialog = useReduxDialog("SelectParentJobExplorer");
    const selectMaterialsReduxDialog = useReduxDialog("SelectMaterialsExplorer");
    return {
        selectWorkflowReduxDialog,
        datasetUploadsReduxDialog,
        selectParentJobExplorerDialog,
        selectMaterialsReduxDialog,
    };
}
