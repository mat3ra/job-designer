import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/* eslint-disable react/destructuring-assignment,react/jsx-props-no-spreading */
import Dialog from "@exabyte-io/cove.js/dist/mui/components/dialog/Dialog";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import React, { useCallback, useEffect, useMemo } from "react";
import { useJobDesignerDeps } from "../JobDesignerContext";
function SelectProjectModal({ id, title = "Select a project for the new job", onSubmit, onCancel, }) {
    var _a, _b;
    const theme = useTheme();
    const { useProfile, useFetchProjectsList } = useJobDesignerDeps();
    const { account } = useProfile();
    const state = useFetchProjectsList("SelectProjectModal");
    const projects = useMemo(() => (state === null || state === void 0 ? void 0 : state.list) || [], [state === null || state === void 0 ? void 0 : state.list]);
    const [selectedProjectId, setSelectedProjectId] = React.useState(((_b = (_a = projects[0]) === null || _a === void 0 ? void 0 : _a.entity) === null || _b === void 0 ? void 0 : _b.id) || null);
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
