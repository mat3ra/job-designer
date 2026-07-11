import { defaultDataset } from "@mat3ra/jode";

import DatasetReducer from "./DatasetReducer";
import JobReducer from "./JobReducer";
import MaterialReducer from "./MaterialReducer";

export function createReducer(initialState: any, ...handlers: any[]) {
    let allHandlers: any = {};
    handlers.forEach((reducer) => {
        allHandlers = Object.assign(allHandlers, reducer);
    });

    return function (state = initialState, action: any) {
        if (Object.prototype.hasOwnProperty.call(allHandlers, action.type)) {
            return allHandlers[action.type](state, action);
        }
        return state;
    };
}

const IS_LOADING_SET = "IS_LOADING_SET";
const isLoadingReducer = {
    [IS_LOADING_SET]: (state: any, action: any) => ({ ...state, isLoading: action.isLoading }),
};

const initialStateFromJobAndAccounts = (
    job: any,
    materials: any[] = [],
    metaProperties: any[] = [],
) => {
    const datasetConfig =
        job && "dataset" in job && job.dataset && "objectStorageContainerData" in job.dataset
            ? job.dataset.objectStorageContainerData
            : defaultDataset.objectStorageContainerData;

    job?.workflow?.updateMethodData(materials, metaProperties);

    const materialForRender = materials[0];
    if (materialForRender && job?.workflow) {
        job.setMaterials(materials);
        job.setMaterial(materialForRender);
    }

    return {
        index: 0,
        material: materials[0],
        materials,
        materialsSet: job && job.materialsSet,
        job,
        isLoading: false,
        isMultiMaterial: job && job.workflow?.isMultiMaterial,
        workflowContexts: materials.map(() => {
            return {};
        }),
        subscriptions: {},
        datasetConfig,
        accountUsers: [],
        renderGeneration: 0,
    };
};

export const createJobDesignerReducer = (job: any, jobMaterials: any[], metaProperties: any[]) => {
    const SubscriptionsReducer = {};
    return createReducer(
        {
            ...initialStateFromJobAndAccounts(job, jobMaterials, metaProperties),
        },
        JobReducer as any,
        DatasetReducer as any,
        MaterialReducer as any,
        SubscriptionsReducer,
        isLoadingReducer,
    );
};
