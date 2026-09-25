/* eslint-disable react/prop-types */
import Alert from "@mui/material/Alert";
import setClass from "classnames";
import React from "react";

import { useJobDesignerDeps } from "../JobDesignerContext";

interface FilesTabProps {
    className?: string;
    id?: string;
    role?: string;
    job: any;
    /**
     * Optional: the sole caller (`Job`) has never passed this, and web-app's real
     * `FilesExplorerContainer` declares `account?: CoreAccount` optional too — the previous
     * `account: any` here claimed a requirement that never held.
     */
    account?: any;
}

function FilesTab({ className, id, role, job, account }: FilesTabProps) {
    const { FilesExplorerContainer } = useJobDesignerDeps();
    return (
        <div className={setClass(className, "row files-step")} id={id} role={role}>
            <div className="job-units-view-wrap">
                {/* Show FilesExplorerContainer if injected (standalone stub or webapp explorer).
                    Falls back to the error alert only when no container is provided at all. */}
                {FilesExplorerContainer ? (
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
