export default DatasetTab;
declare class DatasetTab extends React.Component<any, any, any> {
    constructor(props: any);
    state: {
        dataContent: any[];
    };
    componentDidMount(): void;
    componentDidUpdate(prevProps: any): void;
    /**
     * If datasetconfig is empty, or missing the name key, consider it incomplete.
     * This can occur when creating a new job.
     * @param datasetConfig
     * @returns {boolean}
     */
    datasetConfigPropsAreIncomplete(datasetConfig: any): boolean;
    /**
     * If the dataset config prop isn't empty, and it was either previously empty or has changed in this update
     * then we'll consider the datsetConfig changed since the last update
     * @param datasetConfig {{name: string, key: string, provider: string, region: string, bucket: string}}
     * @param prevDatasetConfig {{name: string, key: string, provider: string, region: string, bucket: string}|{}}
     * @returns {boolean}
     */
    datasetConfigPropsHaveChanged(datasetConfig: {
        name: string;
        key: string;
        provider: string;
        region: string;
        bucket: string;
    }, prevDatasetConfig: {
        name: string;
        key: string;
        provider: string;
        region: string;
        bucket: string;
    } | {}): boolean;
    /**
     * Given the appropriate file configuration, set up a series of callbacks to download the file, processes it as a
     * CSV into an appropriate data structure, and then update this component's state with the loaded file contents.
     * @param fileConfig {{name: string, key: string, provider: string, region: string, bucket: string}}
     */
    updateDataGridFromCsvFile(fileConfig: {
        name: string;
        key: string;
        provider: string;
        region: string;
        bucket: string;
    }): void;
    render(): React.JSX.Element;
}
declare namespace DatasetTab {
    namespace propTypes {
        let className: PropTypes.Requireable<string>;
        let id: PropTypes.Requireable<string>;
        let role: PropTypes.Requireable<string>;
        let profile: PropTypes.Validator<object>;
        let datasetConfig: PropTypes.Requireable<object>;
    }
    namespace defaultProps {
        let className_1: string;
        export { className_1 as className };
        let id_1: string;
        export { id_1 as id };
        let role_1: string;
        export { role_1 as role };
        let datasetConfig_1: {};
        export { datasetConfig_1 as datasetConfig };
    }
}
import React from "react";
import PropTypes from "prop-types";
//# sourceMappingURL=DatasetTab.d.ts.map