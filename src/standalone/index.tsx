import "./preloads";
import React, { useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DownloadIcon from "@mui/icons-material/Download";
import WorkIcon from "@mui/icons-material/AccountTree";
import ScienceIcon from "@mui/icons-material/Science";

import { WorkflowStandata, MaterialStandata } from "@mat3ra/standata";
import { Workflow as WodeWorkflow } from "@mat3ra/wode";
import { Material } from "@mat3ra/made";
import { Job } from "@mat3ra/jode";
import { ThreeDEditor } from "@exabyte-io/wave.js";
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

function tryCreateWorkflow(json: any): WodeWorkflow | null {
    try {
        return new WodeWorkflow(json);
    } catch (e) {
        console.error("[job-designer standalone] WodeWorkflow construction failed:", e);
        return null;
    }
}

/** Material viewer using wave.js ThreeDEditor. */
function StandaloneMaterialViewer({ material }: { material: any }) {
    return (
        <Box sx={{ height: "calc(100vh - 200px)", minHeight: 500, width: "100%" }}>
            <ThreeDEditor material={material} isEditable={false} isStandalone={false} />
        </Box>
    );
}

function downloadJson(data: unknown, filename: string) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

function App() {
    const allWorkflowJsons = useMemo(() => new WorkflowStandata().getAll() ?? [], []);
    const [workflowIndex, setWorkflowIndex] = useState(0);
    const wodeWorkflow = useMemo(
        () => tryCreateWorkflow(allWorkflowJsons[workflowIndex]) ?? tryCreateWorkflow(allWorkflowJsons[0]),
        [workflowIndex, allWorkflowJsons],
    );

    const allMaterialJsons = useMemo(
        () =>
            (new MaterialStandata().getAll() ?? []).map((m: any, i: number) => ({
                _id: `standata-material-${i}`,
                ...m,
            })),
        [],
    );
    const [materialIndex, setMaterialIndex] = useState(() => {
        const idx = allMaterialJsons.findIndex((m: any) => /silicon|^si\b/i.test(m.name ?? ""));
        return idx >= 0 ? idx : 0;
    });
    const selectedMaterial = useMemo(
        () => new Material(allMaterialJsons[materialIndex]),
        [materialIndex, allMaterialJsons],
    );

    const jobRef = useRef<InstanceType<typeof Job> | null>(null);

    const job = useMemo(() => {
        if (!wodeWorkflow || !selectedMaterial) return null;
        try {
            const matName = allMaterialJsons[materialIndex]?.formula ?? allMaterialJsons[materialIndex]?.name ?? "Material";
            const name = `${wodeWorkflow.name} — ${matName}`;
            const newJob = new Job({ name });
            newJob.setWorkflow(wodeWorkflow);
            newJob.setMaterial(selectedMaterial);
            return newJob;
        } catch (e) {
            console.error("[job-designer standalone] Job creation failed:", e);
            return null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wodeWorkflow, selectedMaterial]);

    if (job) jobRef.current = job;

    const handleExportJson = () => {
        const jobInstance = jobRef.current;
        if (!jobInstance) return;
        const raw = (jobInstance as any).toJSON?.() ?? (jobInstance as any)._json ?? {};
        const name = (jobInstance as any).name ?? "job";
        const safeFilename = `job-${name.replace(/[^a-z0-9_-]/gi, "_").toLowerCase()}-${Date.now()}.json`;
        downloadJson(raw, safeFilename);
    };

    const designerKey = `${workflowIndex}-${materialIndex}`;

    if (!wodeWorkflow || !selectedMaterial || !job) {
        return (
            <Box p={4}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            {/* ── TOP BAR: workflow + material selectors + Export JSON ── */}
            <Paper
                elevation={0}
                square
                sx={{
                    px: 2,
                    py: 1,
                    bgcolor: "background.paper",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                }}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    {/* Workflow selector */}
                    <Stack direction="row" spacing={1} alignItems="center">
                        <WorkIcon fontSize="small" sx={{ color: "primary.main", flexShrink: 0 }} />
                        <FormControl size="small" sx={{ minWidth: 280 }}>
                            <InputLabel id="workflow-select-label">Workflow</InputLabel>
                            <Select
                                labelId="workflow-select-label"
                                value={workflowIndex}
                                label="Workflow"
                                onChange={(e) => setWorkflowIndex(Number(e.target.value))}>
                                {allWorkflowJsons.map((wf: any, i: number) => (
                                    <MenuItem key={i} value={i}>
                                        {wf?.name ?? `Workflow ${i + 1}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    {/* Material selector */}
                    <Stack direction="row" spacing={1} alignItems="center">
                        <ScienceIcon fontSize="small" sx={{ color: "secondary.main", flexShrink: 0 }} />
                        <FormControl size="small" sx={{ minWidth: 240 }}>
                            <InputLabel id="material-select-label">Material</InputLabel>
                            <Select
                                labelId="material-select-label"
                                value={materialIndex}
                                label="Material"
                                onChange={(e) => setMaterialIndex(Number(e.target.value))}>
                                {allMaterialJsons.map((mat: any, i: number) => (
                                    <MenuItem key={i} value={i}>
                                        {mat?.name ?? mat?.formula ?? `Material ${i + 1}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    <Divider orientation="vertical" flexItem />

                    <Tooltip title={`${allWorkflowJsons.length} workflows · ${allMaterialJsons.length} materials from standata`}>
                        <Chip label="standata" size="small" variant="outlined" color="secondary" />
                    </Tooltip>

                    <Box sx={{ flexGrow: 1 }} />

                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportJson}
                        sx={{
                            borderColor: "rgba(124,77,255,0.5)",
                            color: "primary.main",
                            "&:hover": {
                                borderColor: "primary.main",
                                bgcolor: "rgba(124,77,255,0.08)",
                            },
                        }}>
                        Export JSON
                    </Button>
                </Stack>
            </Paper>

            {/* ── JOB DESIGNER: EntityHeader + tabs ── */}
            <JobDesignerProvider deps={{ getRouteQueryTab: () => "workflow" }}>
                <JobLocalReduxContainer
                    key={designerKey}
                    job={job}
                    jobMaterials={[selectedMaterial]}
                    materials={[selectedMaterial]}
                    project={{ name: "Demo Project", _id: "standalone-project" } as any}
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
                    MaterialViewerComponent={StandaloneMaterialViewer as any}
                />
            </JobDesignerProvider>
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
