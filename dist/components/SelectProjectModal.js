import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/* eslint-disable react/destructuring-assignment,react/jsx-props-no-spreading */
import Dialog from "@mat3ra/cove/dist/mui/components/dialog/Dialog";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import React, { useCallback, useEffect, useMemo } from "react";
import { useJobDesignerDeps } from "../JobDesignerContext";
function SelectProjectModal({ id, title = "Select a project for the new job", onSubmit, onCancel, }) {
    var _a, _b, _c;
    const theme = useTheme();
    const { useProfile, useFetchProjectsList } = useJobDesignerDeps();
    const { account } = useProfile();
    // Scope to the current account - without ownerId, the webapp's real useFetchProjectsList
    // returns every project accessible to the user (any team/sharing route), not just this
    // account's own, and the "pick the isDefault one" effect below could then auto-select
    // another account's default project instead of the current one's.
    const state = useFetchProjectsList("SelectProjectModal", { ownerId: (_a = account === null || account === void 0 ? void 0 : account.entity) === null || _a === void 0 ? void 0 : _a.id });
    const projects = useMemo(() => (state === null || state === void 0 ? void 0 : state.list) || [], [state === null || state === void 0 ? void 0 : state.list]);
    const [selectedProjectId, setSelectedProjectId] = React.useState(((_c = (_b = projects[0]) === null || _b === void 0 ? void 0 : _b.entity) === null || _c === void 0 ? void 0 : _c.id) || null);
    const handleChange = useCallback((event) => {
        setSelectedProjectId(event.target.value);
    }, []);
    const handleSubmit = useCallback(() => {
        const selectedProject = projects.find((project) => project.entity.id === selectedProjectId);
        if (selectedProject) {
            onSubmit(selectedProject.entity.slug);
        }
    }, [projects, selectedProjectId, onSubmit]);
    useEffect(() => {
        var _a;
        const defaultProjectId = (_a = projects.find((project) => project.entity.isDefault)) === null || _a === void 0 ? void 0 : _a.entity.id;
        if (defaultProjectId) {
            setSelectedProjectId(defaultProjectId);
        }
    }, [projects]);
    return (_jsx(Dialog, { open: true, id: id, title: title, onSubmit: handleSubmit, onCancel: onCancel, submitButtonText: "Create New Job", maxWidth: "sm", fullWidth: true, children: _jsxs("div", { style: { width: "100%" }, children: [_jsx("div", { children: _jsx(Select, { labelId: "demo-simple-select-label", id: "demo-simple-select", sx: { width: "100%", height: 56, fontSize: 14 }, value: selectedProjectId || "", onChange: handleChange, children: projects.map((project) => (_jsx(MenuItem, { value: project.entity.id, sx: { fontSize: 14 }, children: project.entity.name }, project.entity.id))) }) }), _jsx("div", { style: { marginTop: theme.spacing(1) }, children: _jsxs(Typography, { variant: "body2", onClick: onCancel, children: ["or ", _jsx(Link, { href: "/#projects", children: "create new project" })] }) })] }) }));
}
export default SelectProjectModal;
