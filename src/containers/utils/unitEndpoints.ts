import type { PropertyHolderSchema } from "@mat3ra/esse/dist/js/types";

/** A job property row as it reaches the client: only the fields these helpers read. */
export type JobPropertyRow = Pick<PropertyHolderSchema, "source" | "data" | "repetition">;

type JupyterEndpointData = Extract<
    PropertyHolderSchema["data"],
    { name: "jupyter_notebook_endpoint" }
>;

export const JUPYTER_NOTEBOOK_ENDPOINT: JupyterEndpointData["name"] = "jupyter_notebook_endpoint";

/** An endpoint a unit serves while it runs. `url` is relative to the platform origin. */
export type UnitEndpoint = {
    id: string;
    label: string;
    url: string;
};

/**
 * Endpoints served by each unit of a job, keyed by unit flowchart id then by repetition — a unit
 * in a map subworkflow runs once per branch and serves its own endpoint per repetition.
 *
 * The `/jupyter/<jobId>/<unitId>/` prefix is a contract shared with two other repositories:
 * rupy serves the notebook on exactly this path (`c.NotebookApp.base_url` in
 * `src/software/scripting/jupyter_lab/unit.py`) and the web-app proxy reads jobId and unitId back
 * out of it by position (`imports/proxy/server/jupyterProxy.js`). The trailing slash on `tree/`
 * is deliberate — verified against jupyterLab 4.3.0 and 4.6.0.
 */
export function getUnitEndpointsByFlowchartId(
    jobId: string,
    jobProperties: readonly JobPropertyRow[] | null | undefined,
): Record<string, Record<number, UnitEndpoint[]>> {
    const endpointsByUnitFlowchartId: Record<string, Record<number, UnitEndpoint[]>> = {};

    jobProperties?.forEach((property) => {
        if (property.data.name !== JUPYTER_NOTEBOOK_ENDPOINT) return;
        if (property.source.info.jobId !== jobId) return;

        const { unitId } = property.source.info;
        const { repetition } = property;
        const { token } = property.data;
        if (!token) return;

        const endpointsByRepetition = endpointsByUnitFlowchartId[unitId] ?? {};
        if (endpointsByRepetition[repetition]) return;

        endpointsByRepetition[repetition] = [
            {
                id: "notebook",
                label: "Notebook",
                url: `/jupyter/${jobId}/${unitId}/tree/?token=${token}`,
            },
            {
                id: "lab",
                label: "Lab",
                url: `/jupyter/${jobId}/${unitId}/lab/?token=${token}`,
            },
        ];
        endpointsByUnitFlowchartId[unitId] = endpointsByRepetition;
    });

    return endpointsByUnitFlowchartId;
}
