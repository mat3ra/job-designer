export const DATASET_UPDATE = "DATASET_UPDATE";
export function datasetUpdate(datasetConfig, dispatch) {
    return {
        type: DATASET_UPDATE,
        datasetConfig,
        dispatch,
    };
}
