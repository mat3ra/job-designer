import "./preloads";
import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { WorkflowStandata, MaterialStandata } from "@mat3ra/standata";
import { Workflow as WodeWorkflow } from "@mat3ra/wode";
import { Material } from "@mat3ra/made";
import { Job } from "@mat3ra/jode";
import { JobDesignerProvider } from "../JobDesignerContext";
import JobLocalReduxContainer from "../containers/JobLocalReduxContainer";

const demoTheme = createTheme({
    palette: {
        mode: "dark",
        primary: { main: "#7c4dff" },
        secondary: { main: "#00e5ff" },
        background: { default: "#0d1117", paper: "#161b22" },
    },
    typography: { fontFamily: "'Inter', 'Roboto', sans-serif" },
});

// Try to create a WodeWorkflow; return null if it fails
function tryCreateWorkflow(json: any): WodeWorkflow | null {
    try {
        return new WodeWorkflow(json);
    } catch {
        return null;
    }
}

function App() {
    // Workflows
    const allWorkflowJsons = useMemo(() => new WorkflowStandata().getAll() ?? [], []);
    const [workflowIndex, setWorkflowIndex] = useState(0);
    const wodeWorkflow = useMemo(
        () => tryCreateWorkflow(allWorkflowJsons[workflowIndex]) ?? tryCreateWorkflow(allWorkflowJsons[0]),
        [workflowIndex, allWorkflowJsons],
    );

    // Materials
    const allMaterialJsons = useMemo(() => new MaterialStandata().getAll() ?? [], []);
    const [materialIndex, setMaterialIndex] = useState(() => {
        const index = allMaterialJsons.findIndex((material: any) => /silicon|^si\b/i.test(material.name ?? ""));
        return index >= 0 ? index : 0;
    });
    const selectedMaterial = useMemo(
        () => new Material(allMaterialJsons[materialIndex]),
        [materialIndex, allMaterialJsons],
    );

    // Create a job from the selected workflow + material
    const job = useMemo(() => {
        try {
            const newJob = new Job({ name: wodeWorkflow?.name ?? "Demo Job" });
            if (wodeWorkflow) newJob.setWorkflow(wodeWorkflow);
            newJob.setMaterial(selectedMaterial);
            return newJob;
        } catch {
            return new Job({ name: "Demo Job" });
        }
    }, [wodeWorkflow, selectedMaterial]);

    const designerKey = `${workflowIndex}-${materialIndex}`;

    if (!wodeWorkflow || !selectedMaterial) {
        return (
            <Box p={4}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                }}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <Typography
                        variant="h5"
                        fontWeight={700}
                        sx={{
                            background: "linear-gradient(135deg, #7c4dff 0%, #00e5ff 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            mr: 2,
                            flexShrink: 0,
                        }}>
                        Job Designer
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 300 }}>
                        <InputLabel id="workflow-select-label">Workflow</InputLabel>
                        <Select
                            labelId="workflow-select-label"
                            value={workflowIndex}
                            label="Workflow"
                            onChange={(event) => setWorkflowIndex(Number(event.target.value))}>
                            {allWorkflowJsons.map((workflow: any, index: number) => (
                                <MenuItem key={index} value={index}>
                                    {workflow?.name ?? `Workflow ${index + 1}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Divider orientation="vertical" flexItem />
                    <FormControl size="small" sx={{ minWidth: 260 }}>
                        <InputLabel id="material-select-label">Material</InputLabel>
                        <Select
                            labelId="material-select-label"
                            value={materialIndex}
                            label="Material"
                            onChange={(event) => setMaterialIndex(Number(event.target.value))}>
                            {allMaterialJsons.map((material: any, index: number) => (
                                <MenuItem key={index} value={index}>
                                    {material?.name ?? material?.formula ?? `Material ${index + 1}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Chip
                        label={`${allWorkflowJsons.length} workflows · ${allMaterialJsons.length} materials`}
                        size="small"
                        variant="outlined"
                        color="secondary"
                        sx={{ ml: "auto" }}
                    />
                </Stack>
            </Box>
            <Box sx={{ height: "calc(100vh - 72px)", overflow: "auto" }}>
                <JobDesignerProvider>
                    <JobLocalReduxContainer
                        key={designerKey}
                        job={job}
                        jobMaterials={[selectedMaterial]}
                        materials={[selectedMaterial]}
                        project={null}
                        metaProperties={[]}
                        accountUsers={[]}
                        accountUsersIsLoading={false}
                        profile={
                            {
                                user: { entity: { id: "1" } },
                                account: { entity: { id: "1" } },
                                personalAccount: { entity: { id: "1" } },
                            } as any
                        }
                        publicAccount={{ entity: { id: "public" } } as any}
                        clusters={[]}
                        refreshMetaProperties={() => {}}
                        jobDialogs={{
                            selectMaterialsReduxDialog: { isOpen: false, open: () => {}, close: () => {} },
                            selectParentJobExplorerDialog: { isOpen: false, open: () => {}, close: () => {} },
                            selectWorkflowReduxDialog: { isOpen: false, open: () => {}, close: () => {} },
                            datasetUploadsReduxDialog: { isOpen: false, open: () => {}, close: () => {} },
                        }}
                        workflowDialogs={{
                            pseudoUploadReduxDialog: [() => {}, () => {}] as any,
                            unitTypeReduxDialog: [() => {}, () => {}] as any,
                        }}
                        templates={[]}
                        resultsProperties={[]}
                        jobProperties={[]}
                        createMetaProperty={async () => undefined}
                        fetchMaterials={async () => []}
                        loadWorkflowEntityById={async () => undefined}
                    />
                </JobDesignerProvider>
            </Box>
        </Box>
    );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
ReactDOM.render(
    <React.StrictMode>
        <ThemeProvider theme={demoTheme}>
            <CssBaseline />
            <App />
        </ThemeProvider>
    </React.StrictMode>,
    rootElement,
);
