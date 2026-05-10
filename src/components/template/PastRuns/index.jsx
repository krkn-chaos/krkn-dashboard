import "./index.less";

import {
  Button,
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyState,
  EmptyStateBody,
  Form,
  FormGroup,
  Label,
  Pagination,
  TextInput,
  Title,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import {
  CaretDownIcon,
  CaretRightIcon,
  CheckCircleIcon,
  DownloadIcon,
  ExclamationCircleIcon,
  TachometerAltIcon,
} from "@patternfly/react-icons";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { downloadLogs } from "@/actions/newExperiment";
import { showToast } from "@/actions/toastActions";
import API from "@/utils/axiosInstance";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

const formatFinishedAt = (s) => {
  if (s == null || s === "") return "—";
  return String(s).replace("T", " ").slice(0, 19);
};

const displayName = (row) => {
  const n = row?.name || "";
  return n.replace(/^\//, "") || row?.container_id?.slice(0, 12) || "—";
};

const emptyApplied = () => ({
  nameRegex: "",
  imageContains: "",
  startDate: "",
  endDate: "",
});

const flattenGroupRows = (groups) => {
  const out = [];
  for (const g of groups || []) {
    out.push(g.root);
    for (const r of g.replays || []) {
      out.push(r);
    }
  }
  return out;
};

const PastRuns = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const focusOnceRef = useRef(null);

  const [nameRegex, setNameRegex] = useState("");
  const [imageContains, setImageContains] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [applied, setApplied] = useState(emptyApplied);

  const [outcome, setOutcome] = useState("all");
  const [runKind, setRunKind] = useState("all");
  const [sortBy, setSortBy] = useState("finishedAt");
  const [sortDir, setSortDir] = useState("desc");

  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 25,
    itemCount: 0,
    totalPages: 1,
  });

  const [stats, setStats] = useState({
    total: 0,
    passes: 0,
    fails: 0,
    passPercent: 0,
  });
  const [runGroups, setRunGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [selectedFallback, setSelectedFallback] = useState(null);
  const [parentRun, setParentRun] = useState(null);

  useLayoutEffect(() => {
    const id = location.state?.focusContainerId;
    if (!id || typeof id !== "string") return;
    const trimmed = id.trim();
    focusOnceRef.current = trimmed;
    navigate(location.pathname, { replace: true, state: {} });
    setSelectedId(trimmed);
  }, [location.state, location.pathname, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const focusParam = focusOnceRef.current;
      if (focusParam) {
        focusOnceRef.current = null;
      }
      const { data } = await API.post("/past-runs", {
        nameRegex: applied.nameRegex,
        imageContains: applied.imageContains,
        startDate: applied.startDate,
        endDate: applied.endDate,
        outcome,
        runKind,
        sortBy,
        sortDir,
        focusContainerId: focusParam || undefined,
        page,
        perPage: 25,
      });
      const nextGroups = Array.isArray(data.groups) ? data.groups : [];
      setStats(data.stats || { total: 0, passes: 0, fails: 0, passPercent: 0 });
      setRunGroups(nextGroups);
      setPagination(
        data.pagination || { page: 1, perPage: 25, itemCount: 0, totalPages: 1 }
      );
      if (data?.pagination?.page && data.pagination.page !== page) {
        setPage(data.pagination.page);
      }

      const flat = flattenGroupRows(nextGroups);
      setSelectedId((prev) => {
        if (flat.length === 0) return null;
        if (focusParam && flat.some((row) => row.container_id === focusParam)) {
          return focusParam;
        }
        if (prev && flat.some((row) => row.container_id === prev)) return prev;
        return flat[0]?.container_id ?? null;
      });

      setExpandedIds(
        new Set(
          nextGroups
            .filter((g) => g.replays?.length > 0 && !g.isFlatReplay)
            .map((g) => g.root.container_id)
        )
      );
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.message ||
        "Failed to load past runs";
      setError(msg);
      setRunGroups([]);
      setPagination({ page: 1, perPage: 25, itemCount: 0, totalPages: 1 });
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }, [applied, outcome, runKind, sortBy, sortDir, page]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedFromTable = useMemo(() => {
    for (const g of runGroups) {
      if (g.root.container_id === selectedId) return g.root;
      const hit = g.replays?.find((r) => r.container_id === selectedId);
      if (hit) return hit;
    }
    return null;
  }, [runGroups, selectedId]);

  useEffect(() => {
    if (!selectedId || selectedFromTable) {
      setSelectedFallback(null);
      return;
    }
    let cancelled = false;
    API.get(`/past-runs/${encodeURIComponent(selectedId)}`)
      .then(({ data }) => {
        if (!cancelled && data?.run) {
          setSelectedFallback(data.run);
        }
      })
      .catch(() => {
        if (!cancelled) setSelectedFallback(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, selectedFromTable]);

  const detailRow = selectedFromTable || selectedFallback;

  useEffect(() => {
    const pid = detailRow?.replay_of_container_id;
    if (!pid) {
      setParentRun(null);
      return;
    }
    let cancelled = false;
    API.get(`/past-runs/${encodeURIComponent(pid)}`)
      .then(({ data }) => {
        if (!cancelled && data?.run) setParentRun(data.run);
      })
      .catch(() => {
        if (!cancelled) setParentRun(null);
      });
    return () => {
      cancelled = true;
    };
  }, [detailRow?.replay_of_container_id]);

  const logLines = useMemo(() => {
    const raw = detailRow?.content;
    if (raw == null || raw === "") return [];
    return String(raw).split(/\r?\n/);
  }, [detailRow]);

  const applyFilters = (ev) => {
    ev.preventDefault();
    setApplied({
      nameRegex: nameRegex.trim(),
      imageContains: imageContains.trim(),
      startDate: startDate.trim(),
      endDate: endDate.trim(),
    });
    setPage(1);
  };

  const toggleExpand = (rootId, ev) => {
    ev.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(rootId)) next.delete(rootId);
      else next.add(rootId);
      return next;
    });
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
    setPage(1);
  };

  const goReplay = async () => {
    const row = detailRow;
    if (!row?.scenario_params?.scenarioChecked) {
      dispatch(
        showToast(
          "warning",
          "Replay unavailable",
          "Scenario configuration was not stored for this run."
        )
      );
      return;
    }

    let cfg = row.scenario_params;
    let sourceId = row.container_id;
    let sourceDisplayName = displayName(row);

    if (row.run_kind_normalized === "replay") {
      const parentId = row.replay_of_container_id;
      if (!parentId) {
        dispatch(
          showToast(
            "warning",
            "Replay unavailable",
            "Original run reference is missing."
          )
        );
        return;
      }
      try {
        const { data } = await API.get(
          `/past-runs/${encodeURIComponent(parentId)}`
        );
        const orig = data?.run;
        if (!orig?.scenario_params?.scenarioChecked) {
          dispatch(
            showToast(
              "warning",
              "Replay unavailable",
              "Could not load the original run configuration."
            )
          );
          return;
        }
        cfg = orig.scenario_params;
        sourceId = orig.container_id;
        sourceDisplayName = displayName(orig);
      } catch {
        dispatch(
          showToast(
            "danger",
            "Replay failed",
            "Could not load the original run."
          )
        );
        return;
      }
    }

    navigate("/", {
      state: {
        replay: {
          sourceContainerId: sourceId,
          sourceDisplayName,
          params: cfg,
        },
      },
    });
  };

  const SortArrow = ({ field }) => {
    const active = sortBy === field;
    return (
      <span className="past-runs__sort-icons" aria-hidden>
        <span
          className={
            active && sortDir === "asc"
              ? "past-runs__sort-active"
              : "past-runs__sort-idle"
          }
        >
          ▲
        </span>
        <span
          className={
            active && sortDir === "desc"
              ? "past-runs__sort-active"
              : "past-runs__sort-idle"
          }
        >
          ▼
        </span>
      </span>
    );
  };

  return (
    <div className="overview-wrapper">
      <Card className="overview-card">
        <CardBody>
          <div className="past-runs">
      <div className="past-runs__header">
        <Title headingLevel="h1" size="3xl" className="past-runs__page-title">
          Past runs
        </Title>
        <Button variant="secondary" onClick={load} isDisabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="past-runs__body-rail">
      <Form className="past-runs__filters" onSubmit={applyFilters}>
        <div className="past-runs__filter-grid">
          <FormGroup label="Name" fieldId="pr-name-regex">
            <TextInput
              id="pr-name-regex"
              value={nameRegex}
              onChange={(_e, v) => setNameRegex(v)}
              placeholder=""
            />
          </FormGroup>
          <FormGroup label="Run type" fieldId="pr-run-kind">
            <div className="pf-v5-c-form-control past-runs__run-type-wrap">
              <select
                id="pr-run-kind"
                aria-label="Run type"
                value={runKind}
                onChange={(e) => {
                  setRunKind(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All runs</option>
                <option value="original">Original only</option>
                <option value="replay">Replay only</option>
              </select>
              <span className="past-runs__run-type-caret" aria-hidden="true">
                <CaretDownIcon />
              </span>
            </div>
          </FormGroup>
          <FormGroup label="Image" fieldId="pr-image">
            <TextInput
              id="pr-image"
              value={imageContains}
              onChange={(_e, v) => setImageContains(v)}
              placeholder="e.g. pod-scenarios"
            />
          </FormGroup>
          <FormGroup label="Start date" fieldId="pr-start">
            <TextInput
              id="pr-start"
              type="date"
              value={startDate}
              onChange={(_e, v) => setStartDate(v)}
            />
          </FormGroup>
          <FormGroup label="End date" fieldId="pr-end">
            <TextInput
              id="pr-end"
              type="date"
              value={endDate}
              onChange={(_e, v) => setEndDate(v)}
            />
          </FormGroup>
          <FormGroup fieldId="pr-submit" className="past-runs__filter-submit">
            <Button variant="primary" type="submit" isDisabled={loading}>
              Apply filters
            </Button>
          </FormGroup>
        </div>
      </Form>

      {error && (
        <div className="pf-v5-u-mb-md">
          <Label color="red">{error}</Label>
        </div>
      )}

      <div className="past-runs__metrics">
        <Card
          className={`past-runs__metric-card${outcome === "all" ? " past-runs__metric-card--active" : ""}`}
          isCompact
          onClick={() => {
            setOutcome("all");
            setPage(1);
          }}
          ouiaId="metric-total"
        >
          <CardTitle>Jobs (filtered)</CardTitle>
          <CardBody>
            <div className="past-runs__metric-value">{stats.total}</div>
            <div className="past-runs__metric-hint">Click to show all matching runs</div>
          </CardBody>
        </Card>
        <Card
          className={`past-runs__metric-card${outcome === "pass" ? " past-runs__metric-card--active" : ""}`}
          isCompact
          onClick={() => {
            setOutcome("pass");
            setPage(1);
          }}
          ouiaId="metric-pass"
        >
          <CardTitle>
            <CheckCircleIcon /> Passes
          </CardTitle>
          <CardBody>
            <div className="past-runs__metric-value">{stats.passes}</div>
            <div className="past-runs__metric-hint">Exit code 0</div>
          </CardBody>
        </Card>
        <Card
          className={`past-runs__metric-card${outcome === "fail" ? " past-runs__metric-card--active" : ""}`}
          isCompact
          onClick={() => {
            setOutcome("fail");
            setPage(1);
          }}
          ouiaId="metric-fail"
        >
          <CardTitle>
            <ExclamationCircleIcon /> Failures
          </CardTitle>
          <CardBody>
            <div className="past-runs__metric-value">{stats.fails}</div>
            <div className="past-runs__metric-hint">Non-zero or unknown exit</div>
          </CardBody>
        </Card>
        <Card className="past-runs__metric-card" isCompact isPlain>
          <CardTitle>
            <TachometerAltIcon /> Pass rate
          </CardTitle>
          <CardBody>
            <div className="past-runs__metric-value">{stats.passPercent}%</div>
          </CardBody>
        </Card>
      </div>

      <Title headingLevel="h2" size="xl" className="past-runs__table-title">
        {outcome === "all" && "Runs"}
        {outcome === "pass" && "Passed runs"}
        {outcome === "fail" && "Failed runs"}
        {loading ? " …" : ` (${pagination.itemCount})`}
      </Title>

      <div className="details-card-body">
        <Table aria-label="Past runs table" variant="compact">
          <Thead>
            <Tr>
              <Th className="past-runs__th-name">
                <Button
                  type="button"
                  variant="plain"
                  className="past-runs__sort-heading"
                  onClick={() => toggleSort("name")}
                >
                  Name <SortArrow field="name" />
                </Button>
              </Th>
              <Th className="past-runs__th-plain">Type</Th>
              <Th className="past-runs__th-plain">Image</Th>
              <Th className="past-runs__th-plain">State</Th>
              <Th className="past-runs__th-plain">Exit code</Th>
              <Th className="past-runs__th-plain">Outcome</Th>
              <Th className="past-runs__th-finished">
                <Button
                  type="button"
                  variant="plain"
                  className="past-runs__sort-heading"
                  onClick={() => toggleSort("finishedAt")}
                >
                  Finished at <SortArrow field="finishedAt" />
                </Button>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {!loading &&
              runGroups.flatMap((group) => {
                const rootId = group.root.container_id;
                const hasNested =
                  group.replays?.length > 0 && !group.isFlatReplay;
                const expanded = expandedIds.has(rootId);
                const rowsOut = [];

                const renderRow = (row, { nested }) => {
                  const isSel = selectedId === row.container_id;
                  return (
                    <Tr
                      key={row.container_id}
                      className={
                        isSel
                          ? `past-runs__row past-runs__row--selected${nested ? " past-runs__row--replay" : ""}`
                          : `past-runs__row${nested ? " past-runs__row--replay" : ""}`
                      }
                      onClick={() => setSelectedId(row.container_id)}
                    >
                      <Td className="past-runs__td-name">
                        <div className="past-runs__name-cell">
                          <span className="past-runs__tree-slot">
                            {!nested && hasNested ? (
                              <Button
                                variant="plain"
                                type="button"
                                size="sm"
                                className="past-runs__expand-btn"
                                aria-expanded={expanded}
                                onClick={(e) => toggleExpand(rootId, e)}
                              >
                                {expanded ? (
                                  <CaretDownIcon />
                                ) : (
                                  <CaretRightIcon />
                                )}
                              </Button>
                            ) : (
                              <span className="past-runs__tree-slot-spacer" />
                            )}
                          </span>
                          {nested ? (
                            <span
                              className="past-runs__replay-indent"
                              aria-hidden
                            />
                          ) : null}
                          <span className="past-runs__name-text">
                            {displayName(row)}
                          </span>
                        </div>
                      </Td>
                      <Td>
                        {row.run_kind_normalized === "replay" ? (
                          <Label color="blue" isCompact>
                            Replay
                          </Label>
                        ) : (
                          <Label isCompact>Original</Label>
                        )}
                      </Td>
                      <Td>{row.image || "—"}</Td>
                      <Td>{row.state || "—"}</Td>
                      <Td>{row.status ?? "—"}</Td>
                      <Td>
                        {row.outcome === "pass" ? (
                          <Label color="green" isCompact>
                            Pass
                          </Label>
                        ) : (
                          <Label color="red" isCompact>
                            Fail
                          </Label>
                        )}
                      </Td>
                      <Td>{formatFinishedAt(row.stored_at)}</Td>
                    </Tr>
                  );
                };

                rowsOut.push(renderRow(group.root, { nested: false }));
                if (hasNested && expanded) {
                  for (const r of group.replays) {
                    rowsOut.push(renderRow(r, { nested: true }));
                  }
                }
                return rowsOut;
              })}
          </Tbody>
        </Table>
      </div>
      <div className="past-runs__pagination">
        <Pagination
          itemCount={pagination.itemCount}
          perPage={25}
          page={page}
          perPageOptions={[{ title: "25", value: 25 }]}
          onSetPage={(_evt, newPage) => setPage(newPage)}
          isCompact
        />
      </div>

      {!loading && runGroups.length === 0 && (
        <p className="pf-v5-u-mt-md pf-v5-u-color-200">
          No runs match the current filters.
        </p>
      )}
      </div>

      {!detailRow ? (
        <Card className="past-runs__detail-card">
          <CardBody>
            <EmptyState>
              <EmptyStateBody>
                Select a run from the table to view metadata and logs.
              </EmptyStateBody>
            </EmptyState>
          </CardBody>
        </Card>
      ) : (
        <>
          <Card className="past-runs__detail-card">
            <CardTitle className="past-runs__detail-title">
              <span>Run details</span>
              <span className="past-runs__detail-actions">
                <Button
                  variant="secondary"
                  onClick={goReplay}
                  isDisabled={
                    loading || !detailRow?.scenario_params?.scenarioChecked
                  }
                >
                  Replay
                </Button>
                <Button
                  variant="link"
                  icon={<DownloadIcon />}
                  iconPosition="end"
                  onClick={() =>
                    dispatch(downloadLogs(displayName(detailRow)))
                  }
                >
                  Download live pod logs
                </Button>
              </span>
            </CardTitle>
            <CardBody>
              <DescriptionList isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>Container</DescriptionListTerm>
                  <DescriptionListDescription>
                    {displayName(detailRow)}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Run ID</DescriptionListTerm>
                  <DescriptionListDescription>
                    {detailRow.container_id}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Run type</DescriptionListTerm>
                  <DescriptionListDescription>
                    {detailRow.run_kind_normalized === "replay"
                      ? "Replay"
                      : "Original"}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                {detailRow.replay_of_container_id ? (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Replayed from</DescriptionListTerm>
                    <DescriptionListDescription>
                      {parentRun ? (
                        <Button
                          variant="link"
                          isInline
                          className="pf-v5-u-pl-0"
                          component="a"
                          href="/past-runs"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate("/past-runs", {
                              state: {
                                focusContainerId: parentRun.container_id,
                              },
                            });
                          }}
                        >
                          {displayName(parentRun)} — {parentRun.container_id}
                        </Button>
                      ) : (
                        detailRow.replay_of_container_id
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                ) : null}
                <DescriptionListGroup>
                  <DescriptionListTerm>Image</DescriptionListTerm>
                  <DescriptionListDescription>
                    {detailRow.image}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Mount</DescriptionListTerm>
                  <DescriptionListDescription>
                    {detailRow.mounts || "—"}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>State</DescriptionListTerm>
                  <DescriptionListDescription>
                    {detailRow.state}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Exit code</DescriptionListTerm>
                  <DescriptionListDescription>
                    {detailRow.status}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                {detailRow.stored_at ? (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Finished at</DescriptionListTerm>
                    <DescriptionListDescription>
                      {detailRow.stored_at}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                ) : null}
              </DescriptionList>
            </CardBody>
          </Card>
          <Card className="past-runs__logs-card">
            <CardTitle>Logs</CardTitle>
            <CardBody>
              <div className="past-runs__logs" tabIndex={0}>
                {logLines.map((line, index) => (
                  <div
                    key={`${detailRow.container_id}-${index}`}
                    className="past-runs__log-line"
                  >
                    {line}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </>
      )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default PastRuns;
