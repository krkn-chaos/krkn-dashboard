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
  Grid,
  GridItem,
  Title,
} from "@patternfly/react-core";
import {
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
} from "@patternfly/react-core";
import React, { useEffect, useMemo, useState } from "react";
import { downloadLogs, getDetails } from "@/actions/newExperiment";
import { useDispatch, useSelector } from "react-redux";

import { DownloadIcon } from "@patternfly/react-icons";
import { RedoIcon } from "@patternfly/react-icons";

const containerLabel = (row) => {
  const n = row?.name || "";
  return n.replace(/^\//, "") || row?.container_id?.slice(0, 12) || "run";
};

const History = () => {
  const dispatch = useDispatch();
  const runs = useSelector((state) => state.experiment.results) || [];
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    dispatch(getDetails());
  }, [dispatch]);

  useEffect(() => {
    if (!runs.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !runs.some((r) => r.container_id === selectedId)) {
      setSelectedId(runs[0].container_id);
    }
  }, [runs, selectedId]);

  const selected = useMemo(
    () => runs.find((r) => r.container_id === selectedId) || null,
    [runs, selectedId]
  );

  const logLines = useMemo(() => {
    const raw = selected?.content;
    if (raw == null || raw === "") return [];
    return String(raw).split(/\r?\n/);
  }, [selected]);

  return (
    <div className="history-workspace">
      <div className="history-workspace__toolbar">
        <Title headingLevel="h1" size="2xl">
          History
        </Title>
        <Button
          variant="secondary"
          icon={<RedoIcon />}
          onClick={() => dispatch(getDetails())}
        >
          Refresh
        </Button>
      </div>
      <Grid hasGutter className="history-workspace__grid">
        <GridItem span={12} md={4} lg={3} className="history-workspace__sidebar">
          <Card isCompact className="history-workspace__list-card">
            <CardTitle>All runs</CardTitle>
            <CardBody className="history-workspace__list-body">
              {runs.length === 0 ? (
                <EmptyState>
                  <EmptyStateBody>
                    No completed runs in the database yet. When a Kraken
                    container exits, its logs and details are stored here
                    automatically.
                  </EmptyStateBody>
                </EmptyState>
              ) : (
                <DataList
                  aria-label="Kraken run history from database"
                  isCompact
                  selectedDataListItemId={selectedId || undefined}
                >
                  {runs.map((row) => {
                    const id = row.container_id;
                    const label = containerLabel(row);
                    const stamp = row.stored_at
                      ? new Date(
                          row.stored_at.includes("T")
                            ? row.stored_at
                            : row.stored_at.replace(" ", "T")
                        ).toLocaleString()
                      : "";
                    return (
                      <DataListItem
                        key={id}
                        aria-labelledby={`run-${id}`}
                        id={id}
                        isSelected={selectedId === id}
                      >
                        <DataListItemRow
                          onClick={() => setSelectedId(id)}
                          className="history-workspace__row-click"
                        >
                          <DataListItemCells
                            dataListCells={[
                              <DataListCell key="primary" id={`run-${id}`}>
                                <strong>{label}</strong>
                                <div className="history-workspace__meta">
                                  {row.state} · exit {row.status}
                                </div>
                                {stamp ? (
                                  <div className="history-workspace__stamp">
                                    {stamp}
                                  </div>
                                ) : null}
                              </DataListCell>,
                            ]}
                          />
                        </DataListItemRow>
                      </DataListItem>
                    );
                  })}
                </DataList>
              )}
            </CardBody>
          </Card>
        </GridItem>
        <GridItem span={12} md={8} lg={9}>
          {!selected ? (
            <Card>
              <CardBody>
                <EmptyState>
                  <EmptyStateBody>
                    Select a run on the left to view pod metadata and logs from
                    the local database.
                  </EmptyStateBody>
                </EmptyState>
              </CardBody>
            </Card>
          ) : (
            <>
              <Card className="history-workspace__detail-card">
                <CardTitle className="history-workspace__detail-title">
                  <span>Run details</span>
                  <Button
                    variant="link"
                    icon={<DownloadIcon />}
                    iconPosition="end"
                    onClick={() =>
                      dispatch(downloadLogs(containerLabel(selected)))
                    }
                  >
                    Download live pod logs
                  </Button>
                </CardTitle>
                <CardBody>
                  <DescriptionList isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Container</DescriptionListTerm>
                      <DescriptionListDescription>
                        {containerLabel(selected)}
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
              <Card className="history-workspace__logs-card">
                <CardTitle>Logs</CardTitle>
                <CardBody>
                  <div className="history-workspace__logs" tabIndex={0}>
                    {logLines.map((line, i) => (
                      <div key={i} className="history-workspace__log-line">
                        {line}
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </>
          )}
        </GridItem>
      </Grid>
    </div>
  );
};

export default History;
