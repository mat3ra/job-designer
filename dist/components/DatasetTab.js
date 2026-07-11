import { jsx as _jsx } from "react/jsx-runtime";
/* eslint-disable eqeqeq */
/* eslint-disable no-unused-vars */
import setClass from "classnames";
import PropTypes from "prop-types";
import React from "react";
import _ from "underscore";
// Webapp-specific utilities — stubbed for standalone build; provided by webapp at runtime.
const downloadAndProcessFile = () => { };
const handleGetSignedUrlAsCSV = () => { };
const DataGridComponent = () => null;
class DatasetTab extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dataContent: [],
        };
    }
    componentDidMount() {
        const { datasetConfig } = this.props;
        if (!this.datasetConfigPropsAreIncomplete(datasetConfig)) {
            this.updateDataGridFromCsvFile(datasetConfig);
        }
    }
    componentDidUpdate(prevProps) {
        const { datasetConfig } = this.props;
        if (this.datasetConfigPropsHaveChanged(datasetConfig, prevProps.datasetConfig)) {
            this.updateDataGridFromCsvFile(datasetConfig);
        }
    }
    /**
     * If datasetconfig is empty, or missing the name key, consider it incomplete.
     * This can occur when creating a new job.
     * @param datasetConfig
     * @returns {boolean}
     */
    datasetConfigPropsAreIncomplete(datasetConfig) {
        return _.isEmpty(datasetConfig) || !("name" in datasetConfig);
    }
    /**
     * If the dataset config prop isn't empty, and it was either previously empty or has changed in this update
     * then we'll consider the datsetConfig changed since the last update
     * @param datasetConfig {{name: string, key: string, provider: string, region: string, bucket: string}}
     * @param prevDatasetConfig {{name: string, key: string, provider: string, region: string, bucket: string}|{}}
     * @returns {boolean}
     */
    datasetConfigPropsHaveChanged(datasetConfig, prevDatasetConfig) {
        return (!_.isEmpty(datasetConfig) &&
            (_.isEmpty(prevDatasetConfig) ||
                datasetConfig.name != prevDatasetConfig.name ||
                datasetConfig.key != prevDatasetConfig.key ||
                datasetConfig.provider != prevDatasetConfig.provider ||
                datasetConfig.region != prevDatasetConfig.region ||
                datasetConfig.bucket != prevDatasetConfig.bucket));
    }
    /**
     * Given the appropriate file configuration, set up a series of callbacks to download the file, processes it as a
     * CSV into an appropriate data structure, and then update this component's state with the loaded file contents.
     * @param fileConfig {{name: string, key: string, provider: string, region: string, bucket: string}}
     */
    updateDataGridFromCsvFile(fileConfig) {
        const context = this;
        const { profile } = this.props;
        downloadAndProcessFile(profile.account.entity._id, fileConfig, (csvRows, fileMetadata) => {
            context.setState({
                dataContent: csvRows,
            });
        }, handleGetSignedUrlAsCSV);
    }
    render() {
        const { className, id, role } = this.props;
        const { dataContent } = this.state;
        return (_jsx("div", { className: setClass(className), id: id, role: role, children: _jsx(DataGridComponent, { data: dataContent }) }));
    }
}
DatasetTab.propTypes = {
    className: PropTypes.string,
    id: PropTypes.string,
    role: PropTypes.string,
    profile: PropTypes.object.isRequired,
    datasetConfig: PropTypes.object,
};
DatasetTab.defaultProps = {
    className: "",
    id: "",
    role: "",
    datasetConfig: {},
};
export default DatasetTab;
