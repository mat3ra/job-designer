/* eslint-disable react/destructuring-assignment,react/jsx-props-no-spreading */
import Dialog from "@mat3ra/cove/dist/mui/components/dialog/Dialog";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import React, { useCallback, useEffect, useMemo } from "react";

import { useJobDesignerDeps } from "../JobDesignerContext";

export interface SelectProjectModalProps {
    id?: string;
    title?: string;
    onSubmit: (selectedProject: string) => void;
    onCancel: () => void;
}

function SelectProjectModal({
    id,
    title = "Select a project for the new job",
    onSubmit,
    onCancel,
}: SelectProjectModalProps) {
    const theme = useTheme();

    const { useProfile, useFetchProjectsList } = useJobDesignerDeps();
    const { account } = useProfile();
    const state = useFetchProjectsList("SelectProjectModal");
    const projects = useMemo(() => state?.list || [], [state?.list]);

    const [selectedProjectId, setSelectedProjectId] = React.useState(
        projects[0]?.entity?.id || null,
    );

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
        const defaultProjectId = projects.find((project) => project.entity.isDefault)?.entity.id;
        if (defaultProjectId) {
            setSelectedProjectId(defaultProjectId);
        }
    }, [projects]);

    return (
        <Dialog
            open
            id={id}
            title={title}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            submitButtonText="Create New Job"
            maxWidth="sm"
            fullWidth
        >
            <div style={{ width: "100%" }}>
                <div>
                    {/* TODO: maybe move to core_cove in case if similar appears */}
                    <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        sx={{ width: "100%", height: 56, fontSize: 14 }}
                        value={selectedProjectId || ""}
                        onChange={handleChange}
                    >
                        {projects.map((project) => (
                            <MenuItem
                                key={project.entity.id}
                                value={project.entity.id}
                                sx={{ fontSize: 14 }}
                            >
                                {project.entity.name}
                            </MenuItem>
                        ))}
                    </Select>
                </div>
                <div style={{ marginTop: theme.spacing(1) }}>
                    <Typography variant="body2" onClick={onCancel}>
                        or <Link href="/#projects">create new project</Link>
                    </Typography>
                </div>
            </div>
        </Dialog>
    );
}

export default SelectProjectModal;
