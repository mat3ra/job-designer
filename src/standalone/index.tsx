import "./preloads";

import { ThreeDEditor } from "@mat3ra/wave.js";
import { Job } from "@mat3ra/jode";
import { Material } from "@mat3ra/made";
import { MaterialStandata, WorkflowStandata } from "@mat3ra/standata";
import { Workflow as WodeWorkflow } from "@mat3ra/wode";
import WorkIcon from "@mui/icons-material/AccountTree";
import DownloadIcon from "@mui/icons-material/Download";
import ScienceIcon from "@mui/icons-material/Science";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import React, { useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";

import JobLocalReduxContainer from "../containers/JobLocalReduxContainer";
import { JobDesignerProvider } from "../JobDesignerContext";

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

/**
 * A queue as `ive`'s QueuesTable expects it: the webapp passes model instances,
 * so the table reads `maxAvailableNodect`, `capacity`, `load` and calls
 * `getETAClient()`. Plain objects without those crash the queue picker.
 */
function demoQueue({
    name,
    displayName,
    maxAvailableNodect,
    load,
    etaMinutes,
}: {
    name: string;
    displayName: string;
    maxAvailableNodect: number;
    load: number;
    etaMinutes: number;
}) {
    return {
        name,
        displayName,
        maxAvailableNodect,
        nodeLimit: maxAvailableNodect,
        capacity: String(maxAvailableNodect),
        load,
        getETAClient: () => ({ display: `~${etaMinutes} min` }),
    };
}

/**
 * Clusters for the demo. The webapp fetches these; standalone had an empty list,
 * which left the compute step unfillable and the estimate and preflight with
 * nothing to judge — so the two states most worth reviewing could never be seen.
 */
const DEMO_CLUSTERS = [
    {
        hostname: "cluster-007.exabyte.io",
        name: "cluster-007",
        displayName: "cluster-007",
        isDefault: true,
        queues: [
            demoQueue({
                name: "OR",
                displayName: "on-demand regular",
                maxAvailableNodect: 4,
                load: 40,
                etaMinutes: 8,
            }),
            demoQueue({
                name: "OF",
                displayName: "on-demand fast",
                maxAvailableNodect: 2,
                load: 75,
                etaMinutes: 2,
            }),
            demoQueue({
                name: "SR",
                displayName: "spot regular",
                maxAvailableNodect: 8,
                load: 20,
                etaMinutes: 45,
            }),
        ],
    },
    {
        hostname: "master-production-20160630-cluster-001.exabyte.io",
        name: "cluster-001",
        displayName: "cluster-001",
        queues: [
            demoQueue({
                name: "OR",
                displayName: "on-demand regular",
                maxAvailableNodect: 2,
                load: 60,
                etaMinutes: 25,
            }),
            demoQueue({
                name: "D",
                displayName: "debug",
                maxAvailableNodect: 1,
                load: 10,
                etaMinutes: 1,
            }),
        ],
    },
];

/** Pricing, limits and queue waits the host would inject. Not part of the job. */
const DEMO_CLUSTER_METADATA = [
    {
        fqdn: "cluster-007.exabyte.io",
        name: "cluster-007",
        pricePerCoreHour: 0.08,
        currency: "USD",
        limits: { maxNodes: 4, maxPpn: 32, maxWalltimeHours: 12 },
        queueWaitMinutes: 8,
    },
    {
        fqdn: "master-production-20160630-cluster-001.exabyte.io",
        name: "cluster-001",
        pricePerCoreHour: 0.05,
        currency: "USD",
        limits: { maxNodes: 2, maxPpn: 16, maxWalltimeHours: 6 },
        queueWaitMinutes: 25,
    },
];

/** Fixed unix seconds so the simulated run reads the same on every reload. */
const SIMULATED_START = 1_755_000_000;

/**
 * A dialog handle in the tuple shape the webapp passes. The demo has no entity
 * explorer to open, so it says which dialog would have opened rather than
 * silently doing nothing — otherwise a broken wiring looks exactly like a
 * working one.
 */
function demoDialog(name: string): [(...args: unknown[]) => void, () => void] {
    return [
        () => {
            // eslint-disable-next-line no-alert
            window.alert(`${name} — the webapp opens its entity explorer here.`);
        },
        () => {},
    ];
}

const DEMO_QUOTA = { remainingCoreHours: 500, totalCoreHours: 1000, currency: "USD" };

function App() {
    const allWorkflowJsons = useMemo(() => new WorkflowStandata().getAll() ?? [], []);
    const [workflowIndex, setWorkflowIndex] = useState(0);
    const wodeWorkflow = useMemo(
        () =>
            tryCreateWorkflow(allWorkflowJsons[workflowIndex]) ??
            tryCreateWorkflow(allWorkflowJsons[0]),
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
    // Phase 2 layout, opt-in: the demo is where it gets reviewed before any host flips it on.
    const [useGuidedDesigner, setUseGuidedDesigner] = useState(true);
    // A submitted job cannot be reached in the demo — its submit API is a stub —
    // so the monitor, the lifecycle timeline past Draft, and the rail's Monitor
    // step would never be reviewable. This starts the job already running.
    const [isRunSimulated, setIsRunSimulated] = useState(false);
    // The batch multiplier is the thing the plan says surprises readers most —
    // "3 materials, the workflow runs 3 times" — and with a single material the
    // tray copy, the rail summary and the ×3 estimate could never be reviewed.
    const [isBatch, setIsBatch] = useState(false);
    const [materialIndex, setMaterialIndex] = useState(() => {
        const idx = allMaterialJsons.findIndex((m: any) => /silicon|^si\b/i.test(m.name ?? ""));
        return idx >= 0 ? idx : 0;
    });
    const selectedMaterial = useMemo(
        () => new Material(allMaterialJsons[materialIndex]),
        [materialIndex, allMaterialJsons],
    );

    /** One material, or that one plus its two neighbours as a batch. */
    const selectedMaterials = useMemo(() => {
        if (!isBatch) return [selectedMaterial];

        return [0, 1, 2].map(
            (offset) =>
                new Material(allMaterialJsons[(materialIndex + offset) % allMaterialJsons.length]),
        );
    }, [isBatch, selectedMaterial, materialIndex, allMaterialJsons]);

    const jobRef = useRef<InstanceType<typeof Job> | null>(null);

    const job = useMemo(() => {
        if (!wodeWorkflow || !selectedMaterial) return null;
        try {
            const matName =
                allMaterialJsons[materialIndex]?.formula ??
                allMaterialJsons[materialIndex]?.name ??
                "Material";
            const name = `${wodeWorkflow.name} — ${matName}`;
            // pre-submission status makes the header editable (name input + Save button),
            // matching how the webapp shows a new job - without it the demo header hides
            // the exact controls the designer is meant to demo.
            //
            // The `_id` stands in for a job the webapp would have persisted: the demo
            // has no server, so `createOrUpdate` is a no-op and the job would never
            // acquire one - leaving Submit permanently blocked on "Save the job" and
            // the preflight unreachable. The save-state indicator is unaffected; it
            // tracks edits, not identity.
            const newJob = new Job({
                _id: "standalone-job-1",
                name,
                status: isRunSimulated ? "active" : "pre-submission",
                statusTrack: isRunSimulated
                    ? [
                          { status: "pre-submission", trackedAt: SIMULATED_START },
                          { status: "submitted", trackedAt: SIMULATED_START + 60 },
                          { status: "active", trackedAt: SIMULATED_START + 180 },
                      ]
                    : [],
            });
            newJob.setWorkflow(wodeWorkflow);
            newJob.setMaterial(selectedMaterial);

            // job-designer's own reducers (inherited from the webapp's original Job
            // model) read `job.workflow.updateMethodData(...)` directly; jode's Job
            // class exposes the live instance as `workflowInstance` instead. Bridge
            // the two here at the demo boundary only — do not change job-designer's
            // reducer code or jode's Job class.
            Object.defineProperty(newJob, "workflow", {
                get: () => (newJob as any).workflowInstance,
                configurable: true,
            });

            return newJob;
        } catch (e) {
            console.error("[job-designer standalone] Job creation failed:", e);
            return null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wodeWorkflow, selectedMaterial, isRunSimulated]);

    if (job) jobRef.current = job;

    const handleExportJson = () => {
        const jobInstance = jobRef.current;
        if (!jobInstance) return;
        const raw = (jobInstance as any).toJSON?.() ?? (jobInstance as any)._json ?? {};
        const name = (jobInstance as any).name ?? "job";
        const safeFilename = `job-${name
            .replace(/[^a-z0-9_-]/gi, "_")
            .toLowerCase()}-${Date.now()}.json`;
        downloadJson(raw, safeFilename);
    };

    // Remount on a simulated-run flip too: the container builds its redux store from
    // the job it is first given, so a new Job instance alone would not be picked up.
    const designerKey = `${workflowIndex}-${materialIndex}-${isRunSimulated}-${isBatch}`;

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
                }}
            >
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
                                onChange={(e) => setWorkflowIndex(Number(e.target.value))}
                            >
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
                        <ScienceIcon
                            fontSize="small"
                            sx={{ color: "secondary.main", flexShrink: 0 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 240 }}>
                            <InputLabel id="material-select-label">Material</InputLabel>
                            <Select
                                labelId="material-select-label"
                                value={materialIndex}
                                label="Material"
                                onChange={(e) => setMaterialIndex(Number(e.target.value))}
                            >
                                {allMaterialJsons.map((mat: any, i: number) => (
                                    <MenuItem key={i} value={i}>
                                        {mat?.name ?? mat?.formula ?? `Material ${i + 1}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    <Divider orientation="vertical" flexItem />

                    <Tooltip
                        title={`${allWorkflowJsons.length} workflows · ${allMaterialJsons.length} materials from standata`}
                    >
                        <Chip label="standata" size="small" variant="outlined" color="secondary" />
                    </Tooltip>

                    <Box sx={{ flexGrow: 1 }} />

                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setUseGuidedDesigner((isOn) => !isOn)}
                        sx={{ mr: 1 }}
                    >
                        {useGuidedDesigner ? "Guided layout: on" : "Guided layout: off"}
                    </Button>
                    <Button
                        size="small"
                        variant={isRunSimulated ? "contained" : "outlined"}
                        onClick={() => setIsRunSimulated((on) => !on)}
                        data-tid="simulate-run-toggle"
                    >
                        {isRunSimulated ? "Job: running" : "Job: draft"}
                    </Button>
                    <Button
                        size="small"
                        variant={isBatch ? "contained" : "outlined"}
                        onClick={() => setIsBatch((on) => !on)}
                        data-tid="batch-toggle"
                    >
                        {isBatch ? "Materials: 3" : "Materials: 1"}
                    </Button>

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
                        }}
                    >
                        Export JSON
                    </Button>
                </Stack>
            </Paper>

            {/* ── JOB DESIGNER: EntityHeader + tabs ── */}
            <JobDesignerProvider deps={{ getRouteQueryTab: () => "workflow" }}>
                <JobLocalReduxContainer
                    key={designerKey}
                    job={job}
                    jobMaterials={selectedMaterials}
                    materials={selectedMaterials}
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
                    clusters={DEMO_CLUSTERS}
                    refreshMetaProperties={() => {}}
                    // Tuples, as `useReduxDialog` returns and the webapp passes —
                    // the object form the demo used before did not match what
                    // `Job.jsx` destructures, so every "Select …" action threw.
                    jobDialogs={
                        {
                            selectMaterialsReduxDialog: demoDialog("Select materials"),
                            selectParentJobExplorerDialog: demoDialog("Select parent job"),
                            selectWorkflowReduxDialog: demoDialog("Select workflow"),
                            datasetUploadsReduxDialog: demoDialog("Select dataset"),
                        } as any
                    }
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
                    useGuidedDesigner={useGuidedDesigner}
                    clusterMetadata={DEMO_CLUSTER_METADATA}
                    computeQuota={DEMO_QUOTA}
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
