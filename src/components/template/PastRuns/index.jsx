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
  CheckCircleIcon,
  DownloadIcon,
  ExclamationCircleIcon,
  TachometerAltIcon,
} from "@patternfly/react-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { downloadLogs } from "@/actions/newExperiment";
import API from "@/utils/axiosInstance";
import { useDispatch } from "react-redux";

const formatStoredAt = (s) => {
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

const PastRuns = () => {
  const dispatch = useDispatch();
  const [nameRegex, setNameRegex] = useState("");
  const [imageContains, setImageContains] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [applied, setApplied] = useState(emptyApplied);

  const [outcome, setOutcome] = useState("all");
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
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.post("/past-runs", {
        nameRegex: applied.nameRegex,
        imageContains: applied.imageContains,
        startDate: applied.startDate,
        endDate: applied.endDate,
        outcome,
        page,
        perPage: 25,
      });
      const nextRuns = Array.isArray(data.runs) ? data.runs : [];
      setStats(data.stats || { total: 0, passes: 0, fails: 0, passPercent: 0 });
      setRuns(nextRuns);
      setPagination(
        data.pagination || { page: 1, perPage: 25, itemCount: 0, totalPages: 1 }
      );
      if (data?.pagination?.page && data.pagination.page !== page) {
        setPage(data.pagination.page);
      }
      if (!nextRuns.some((row) => row.container_id === selectedId)) {
        setSelectedId(nextRuns[0]?.container_id || null);
      }
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.message ||
        "Failed to load past runs";
      setError(msg);
      setRuns([]);
      setPagination({ page: 1, perPage: 25, itemCount: 0, totalPages: 1 });
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }, [applied, outcome, page, selectedId]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(
    () => runs.find((row) => row.container_id === selectedId) || null,
    [runs, selectedId]
  );

  const logLines = useMemo(() => {
    const raw = selected?.content;
    if (raw == null || raw === "") return [];
    return String(raw).split(/\r?\n/);
  }, [selected]);

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

  return (
    <div className="past-runs">
      <div className="past-runs__header">
        <Title headingLevel="h1" size="2xl">
          Past runs
        </Title>
        <Button variant="secondary" onClick={load} isDisabled={loading}>
          Refresh
        </Button>
      </div>

      <Form className="past-runs__filters" onSubmit={applyFilters}>
        <div className="past-runs__filter-grid">
          <FormGroup label="Name (regex)" fieldId="pr-name-regex">
            <TextInput
              id="pr-name-regex"
              value={nameRegex}
              onChange={(_e, v) => setNameRegex(v)}
              placeholder="e.g. ^test-|^prod-"
            />
          </FormGroup>
          <FormGroup label="Image contains" fieldId="pr-image">
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
          <FormGroup label=" " fieldId="pr-submit">
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

      <Title headingLevel="h2" size="lg" className="past-runs__table-title">
        {outcome === "all" && "Runs"}
        {outcome === "pass" && "Passed runs"}
        {outcome === "fail" && "Failed runs"}
        {loading ? " …" : ` (${pagination.itemCount})`}
      </Title>

      <div className="details-card-body">
        <Table aria-label="Past runs table" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Image</Th>
              <Th>State</Th>
              <Th>Exit code</Th>
              <Th>Outcome</Th>
              <Th>Stored at</Th>
            </Tr>
          </Thead>
          <Tbody>
            {!loading &&
              runs.map((row) => (
                <Tr
                  key={row.container_id}
                  className={
                    selectedId === row.container_id
                      ? "past-runs__row past-runs__row--selected"
                      : "past-runs__row"
                  }
                  onClick={() => setSelectedId(row.container_id)}
                >
                  <Td>{displayName(row)}</Td>
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
                  <Td>{formatStoredAt(row.stored_at)}</Td>
                </Tr>
              ))}
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

      {!loading && runs.length === 0 && (
        <p className="pf-v5-u-mt-md pf-v5-u-color-200">
          No runs match the current filters.
        </p>
      )}

      {!selected ? (
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
              <Button
                variant="link"
                icon={<DownloadIcon />}
                iconPosition="end"
                onClick={() => dispatch(downloadLogs(displayName(selected)))}
              >
                Download live pod logs
              </Button>
            </CardTitle>
            <CardBody>
              <DescriptionList isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>Container</DescriptionListTerm>
                  <DescriptionListDescription>
                    {displayName(selected)}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Container ID</DescriptionListTerm>
                  <DescriptionListDescription>
                    {selected.container_id}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Image</DescriptionListTerm>
                  <DescriptionListDescription>
                    {selected.image}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Mount</DescriptionListTerm>
                  <DescriptionListDescription>
                    {selected.mounts || "—"}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>State</DescriptionListTerm>
                  <DescriptionListDescription>
                    {selected.state}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Exit code</DescriptionListTerm>
                  <DescriptionListDescription>
                    {selected.status}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                {selected.stored_at ? (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Stored at</DescriptionListTerm>
                    <DescriptionListDescription>
                      {selected.stored_at}
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
                    key={`${selected.container_id}-${index}`}
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
  );
};

export default PastRuns;
