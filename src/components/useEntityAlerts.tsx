import Alert from "@mui/material/Alert";
import React, { useCallback, useState } from "react";

/** Shape of a single backend-reported compute error. */
export interface ComputeError {
    message: string;
    reason?: string;
    traceback?: string;
}

/** Shape of a single "on-the-fly" warning. */
export interface WarningConfig {
    condition: boolean;
    message: React.ReactNode;
}

/**
 * What the entity needs to provide. `errors` is always populated by the mixin `@mat3ra/ide`
 * applies to jode's `Job`; `warnings` is optional because nothing in the stack produces it —
 * `ide` dropped its fallback and the intended replacement never landed.
 */
export interface ComputableEntity {
    readonly errors?: ComputeError[];
    readonly warnings?: WarningConfig[];
}

/**
 * Hooks replacement for `@mat3ra/ive`'s `ComputableEntityMixin`, whose only consumer anywhere
 * was this package's `Job` component. Keeps the dismissal state and alert rendering identical.
 */
export default function useEntityAlerts(entity: ComputableEntity | undefined) {
    const [dismissedErrors, setDismissedErrors] = useState<Record<number, boolean>>({});
    const [dismissedWarnings, setDismissedWarnings] = useState<Record<number, boolean>>({});

    // NOTE: replaces the whole map rather than merging, matching the mixin's own
    // `setState({ dismissWarningAlerts: { [key]: true } })` — dismissing one alert has always
    // cleared the record of previously dismissed ones.
    const dismissError = useCallback((key: number) => setDismissedErrors({ [key]: true }), []);
    const dismissWarning = useCallback((key: number) => setDismissedWarnings({ [key]: true }), []);

    // errors come from backend
    const renderErrors = useCallback((): React.ReactNode => {
        const notDismissed = (entity?.errors ?? []).filter((e, idx) => !dismissedErrors[idx]);
        return notDismissed.length > 0
            ? notDismissed.map((err, idx) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <Alert severity="error" key={idx} onClose={() => dismissError(idx)}>
                      {err.message}
                      <br />
                      {Boolean(err.traceback) && (
                          <details>
                              <summary style={{ cursor: "pointer" }}>{err.reason}</summary>
                              <code style={{ whiteSpace: "pre" }}>{err.traceback}</code>
                          </details>
                      )}
                  </Alert>
              ))
            : null;
    }, [entity, dismissedErrors, dismissError]);

    // warnings are calculated "on-the-fly" - optional, see `ComputableEntity` above
    const renderWarnings = useCallback((): React.ReactNode => {
        const notDismissed = (entity?.warnings ?? []).filter((e, idx) => !dismissedWarnings[idx]);
        return notDismissed.map((warningConfig, idx) =>
            warningConfig.condition ? (
                // eslint-disable-next-line react/no-array-index-key
                <Alert severity="warning" key={idx} onClose={() => dismissWarning(idx)}>
                    {warningConfig.message}
                </Alert>
            ) : null,
        );
    }, [entity, dismissedWarnings, dismissWarning]);

    return { renderErrors, renderWarnings };
}
