import { jsx as _jsx } from "react/jsx-runtime";
/* eslint-disable react/prop-types */
import Alert from "@mui/material/Alert";
import setClass from "classnames";
import { useJobDesignerDeps } from "../JobDesignerContext";
function FilesTab({ className, id, role, job, account }) {
    const { FilesExplorerContainer } = useJobDesignerDeps();
    return (_jsx("div", { className: setClass(className, "row files-step"), id: id, role: role, children: _jsx("div", { className: "job-units-view-wrap", children: FilesExplorerContainer ? (_jsx(FilesExplorerContainer, { name: `JobFilesExplorer-${job._id}`, job: job, account: account })) : (_jsx(Alert, { severity: "error", children: "Files are not available for this job." })) }) }));
}
export default FilesTab;
