import { useState, useEffect } from "react";

import API from "./axiosInstance";
import {
  hubFieldToDashboard,
  CONTAINER_RUN_NAME_FIELD,
  DASHBOARD_EXTRA_FIELDS,
} from "./scenarioFields";

// Module-level cache so switching back to a previously loaded scenario is instant.
const cache = new Map();

/**
 * Fetches and transforms krkn-hub field definitions for a given scenario.
 * Returns { fields, loading, error } where `fields` is the full list of
 * dashboard-ready field objects (with the dashboard-only "name" field prepended).
 */
export function useScenarioFields(scenario) {
  const [state, setState] = useState(() => {
    const cached = cache.get(scenario);
    return { fields: cached ?? null, loading: !cached && !!scenario, error: null };
  });

  useEffect(() => {
    if (!scenario) return;
    if (cache.has(scenario)) {
      setState({ fields: cache.get(scenario), loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    API.get(`/scenario-fields/${scenario}`)
      .then((res) => {
        const hubFields = res.data;
        const dashboardFields = [
          CONTAINER_RUN_NAME_FIELD,
          ...hubFields
            .filter((f) => f.type !== "file")
            .map(hubFieldToDashboard),
          ...(DASHBOARD_EXTRA_FIELDS[scenario] ?? []),
        ];
        cache.set(scenario, dashboardFields);
        setState({ fields: dashboardFields, loading: false, error: null });
      })
      .catch((err) => {
        setState({ fields: null, loading: false, error: err });
      });
  }, [scenario]);

  return state;
}
