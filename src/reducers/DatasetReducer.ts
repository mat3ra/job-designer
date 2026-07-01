import path from "path";

import { DATASET_UPDATE } from "../actions";

type Action = {
    datasetConfig: any;
};

function datasetUpdate(state, action: Action) {
    // Set the metadata for the dataset
    const { datasetConfig } = action;

    const DEFAULT_FILES_PREFIX = "/dropbox";
    // Remove the user slug from the filepath (e.g. "foo/bar.csv" => "bar.csv")
    const filepath = path.join(DEFAULT_FILES_PREFIX, datasetConfig.key);
    const basenameArray = datasetConfig.key.split("/");
    const basename = basenameArray.slice(1, basenameArray.length).join("/");

    // Update the job
    const { job } = state;
    job.dataset = {
        objectStorageContainerData: datasetConfig,
        datasetBasename: basename,
        datasetFilepath: filepath,
    };

    // Update State
    return { ...state, datasetConfig, job };
}

export default {
    [DATASET_UPDATE]: datasetUpdate,
};
