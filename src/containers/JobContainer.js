/* eslint-disable import/named */
import { connect } from "react-redux";

import { JobStatus } from "../exports";
import {
    datasetUpdate,
    materialsAdd,
    saveJob,
    setJobMultiMaterial,
    setMaterials,
    submitJob,
    switchMaterialByIndex,
    terminateJob,
    updateJob,
} from "../actions";
import Job from "../components/Job";
import { JobDesignerReduxContext } from "./JobDesignerReduxContext";

/**
 * State of JobDesigner contains:
 * - job - a class that contains the job data
 * - materials - array of materials to operate in wizard (add, remove)
 * - workflows - corresponding workflows. Possible situations:
 *  -- single workflow in case when job's workflow is multi-material
 *  -- array of workflows. Each workflow rendered based on corresponding material from materials array
 *     Multiple workflows are required to be able to adjust unit inputs individually for each material
 *     (adjusting some material specific param in unit input)
 *  - isLoading - indicates whether time-consuming operation is in progress
 *  - isMultiMaterial - indicates whether editing job is multi-material
 *  - index - index to switch between materials/workflows. Shared for both arrays.
 *  - allowedMaterials - materials list allowed to select/add
 */

const mapStateToProps = (state, ownProps) => {
    return {
        ...ownProps, // job
        job: state.job,
        isLoading: state.isLoading,
        editable: state.job.status === JobStatus.pre_submission,
        isMultiMaterial: state.isMultiMaterial || false,

        // material
        index: state.index,
        length: state.materials.length,
        material: state.materials[state.index],
        materials: state.materials,
        allowedMaterials: state.allowedMaterials || [],

        // workflow
        /*
         * @deprecated
         */
        allowedWorkflows: state.allowedWorkflows || [],

        // dataset
        datasetConfig: state.datasetConfig,
        renderGeneration: state.renderGeneration || 0,
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        onUpdate: (job) => dispatch(updateJob(job, ownProps.metaProperties)),
        onSave: (omitRedirect) => dispatch(saveJob(dispatch, ownProps.project, omitRedirect)),
        onTerminate: () => dispatch(terminateJob(dispatch)),
        onSubmit: () => dispatch(submitJob(dispatch)),
        onIsMultiMaterialChanged: (bool) => dispatch(setJobMultiMaterial(bool)),

        // TODO: use only one of the 2 methods below
        onUpdateIndex: (index) => dispatch(switchMaterialByIndex(index)),
        onMaterialSwitch: (index) => dispatch(switchMaterialByIndex(index)),

        onMaterialAdd: (materials, accounts) => {
            dispatch(materialsAdd(materials, ownProps.metaProperties));
            if (ownProps.onMaterialAdd) {
                ownProps.onMaterialAdd(materials, accounts);
            }
        },
        onMaterialRemove: (indices) => {
            if (ownProps.onMaterialRemove) {
                ownProps.onMaterialRemove(indices);
            }
        },
        onSetMaterials: (materials, materialsSet) =>
            dispatch(setMaterials(materials, materialsSet, ownProps.metaProperties)),

        onWorkflowSelect: (workflow) => ownProps.onWorkflowSelect(workflow),
        onWorkflowUpdate: (workflow) => ownProps.onWorkflowUpdate(workflow),
        // Subscription for unit output moved to the corresponding component => TODO: clean up the below
        onOutputUpdateRequest: () => {},
        onDestroy: () => {
            if (ownProps.onDestroy) {
                ownProps.onDestroy();
            }
        },

        onSetDataset: (dataset) => dispatch(datasetUpdate(dataset, dispatch)),

        getJobMaterialClient: async (job) => {
            if (ownProps.getJobMaterialClient) {
                return ownProps.getJobMaterialClient(job);
            }
            return null;
        },
    };
};

const JobContainer = connect(mapStateToProps, mapDispatchToProps, null, {
    context: JobDesignerReduxContext,
})(Job);

export default JobContainer;
