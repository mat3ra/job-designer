/* eslint-disable react/prop-types */
import Alert from "@mui/material/Alert";
import { useJobDesignerDeps } from "../JobDesignerContext";
import setClass from "classnames";
import React from "react";

interface FilesTabProps {
    className: string;
    id: string;
    role: string;
    job: any;
    account: any;
}

function FilesTab({ className, id, role, job, account }: FilesTabProps) {
    const { FilesExplorerContainer } = useJobDesignerDeps();
    return (
        <div className={setClass(className, "row files-step")} id={id} role={role}>
            <div className="job-units-view-wrap">
                {/* TODO: improve explorer Redux dependencies and remove Redux Provider below */}
                {job.clusterFqdn && FilesExplorerContainer ? (
                    <FilesExplorerContainer
                        name={`JobFilesExplorer-${job._id}`}
                        job={job}
                        account={account}
                    />
                ) : (
                    <Alert severity="error">Files are not available for this job.</Alert>
                )}
            </div>
        </div>
    );
}

export default FilesTab;
