import setClass from "classnames";
import React, { useCallback, useEffect, useState } from "react";
import _ from "underscore";

// Webapp-specific utilities — stubbed for standalone build; provided by webapp at runtime.
const downloadAndProcessFile = (
    _accountId: string,
    _fileConfig: DatasetConfig,
    _onLoaded: (csvRows: unknown[], fileMetadata?: unknown) => void,
    _getSignedUrlAsCSV: () => void,
) => {};
const handleGetSignedUrlAsCSV = () => {};
function DataGridComponent(_props: { data: unknown[] }) {
    return null;
}

export interface DatasetConfig {
    name?: string;
    key?: string;
    provider?: string;
    region?: string;
    bucket?: string;
}

export interface DatasetTabProps {
    className?: string;
    id?: string;
    role?: string;
    profile: { account: { entity: { _id: string } } };
    datasetConfig?: DatasetConfig;
}

/**
 * If datasetConfig is empty, or missing the name key, consider it incomplete.
 * This can occur when creating a new job.
 */
function datasetConfigPropsAreIncomplete(datasetConfig: DatasetConfig) {
    return _.isEmpty(datasetConfig) || !("name" in datasetConfig);
}

export default function DatasetTab({
    className = "",
    id = "",
    role = "",
    profile,
    datasetConfig = {},
}: DatasetTabProps) {
    const [dataContent, setDataContent] = useState<unknown[]>([]);

    /**
     * Given the appropriate file configuration, set up a series of callbacks to download the
     * file, process it as a CSV into an appropriate data structure, and then update state with
     * the loaded file contents.
     */
    const updateDataGridFromCsvFile = useCallback(
        (fileConfig: DatasetConfig) => {
            downloadAndProcessFile(
                profile.account.entity._id,
                fileConfig,
                (csvRows) => setDataContent(csvRows),
                handleGetSignedUrlAsCSV,
            );
        },
        [profile],
    );

    // Replaces componentDidMount + componentDidUpdate's `datasetConfigPropsHaveChanged` check:
    // the dependency list below is exactly the field set that comparison used, so the effect
    // re-runs on precisely the same transitions, and the incompleteness guard is the mount-time
    // one. Depends on the individual fields rather than the object, since callers pass a fresh
    // object literal (defaulted to `{}` above) on every render.
    const { name, key, provider, region, bucket } = datasetConfig;
    useEffect(() => {
        // Guard against the ORIGINAL object, not a reconstruction: the check is
        // `!("name" in config)`, and rebuilding it from destructured fields would always
        // have the key present (value `undefined`), silently defeating the guard.
        if (!datasetConfigPropsAreIncomplete(datasetConfig)) {
            updateDataGridFromCsvFile(datasetConfig);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name, key, provider, region, bucket, updateDataGridFromCsvFile]);

    return (
        <div className={setClass(className)} id={id} role={role}>
            <DataGridComponent data={dataContent} />
        </div>
    );
}
