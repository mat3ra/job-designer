import { defaultDataset } from "@mat3ra/jode";
import DatasetReducer from "./DatasetReducer";
import JobReducer from "./JobReducer";
import MaterialReducer from "./MaterialReducer";
export function createReducer(initialState, ...handlers) {
    let allHandlers = {};
    handlers.forEach((reducer) => {
        allHandlers = Object.assign(allHandlers, reducer);
    });
    return function (state = initialState, action) {
        if (Object.prototype.hasOwnProperty.call(allHandlers, action.type)) {
            return allHandlers[action.type](state, action);
        }
        return state;
    };
}
const IS_LOADING_SET = "IS_LOADING_SET";
const isLoadingReducer = {
    [IS_LOADING_SET]: (state, action) => ({ ...state, isLoading: action.isLoading }),
};
const initialStateFromJobAndAccounts = (job, materials = [], metaProperties = []) => {
    var _a, _b;
    const datasetConfig = job && "dataset" in job && job.dataset && "objectStorageContainerData" in job.dataset
        ? job.dataset.objectStorageContainerData
        : defaultDataset.objectStorageContainerData;
    (_a = job === null || job === void 0 ? void 0 : job.workflow) === null || _a === void 0 ? void 0 : _a.updateMethodData(materials, metaProperties);
    const materialForRender = materials[0];
    if (materialForRender && (job === null || job === void 0 ? void 0 : job.workflow)) {
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
        isMultiMaterial: job && ((_b = job.workflow) === null || _b === void 0 ? void 0 : _b.isMultiMaterial),
        workflowContexts: materials.map(() => {
            return {};
        }),
        subscriptions: {},
        datasetConfig,
        accountUsers: [],
        renderGeneration: 0,
    };
};
export const createJobDesignerReducer = (job, jobMaterials, metaProperties) => {
    const SubscriptionsReducer = {};
    return createReducer({
        ...initialStateFromJobAndAccounts(job, jobMaterials, metaProperties),
    }, JobReducer, DatasetReducer, MaterialReducer, SubscriptionsReducer, isLoadingReducer);
};
