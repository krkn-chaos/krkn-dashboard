import React, { useEffect } from "react";
import "./index.less";
import { Card, CardBody, Grid, GridItem } from "@patternfly/react-core";
import { useDispatch, useSelector } from "react-redux";
import { fetchSummaryData } from "@/actions/summaryActions";
import MetricCard from "@/components/molecules/MetricsCard";
import ScenarioChart from "@/components/organisms/SummaryPageCharts/ScenarioChart";
import CloudCharts from "@/components/organisms/SummaryPageCharts/CloudCharts";
import MajorVersionCharts from "@/components/organisms/SummaryPageCharts/VersionChart";
import ScenarioRiskTable from "@/components/molecules/ScenarioRiskTable";

const Summary = () => {
	const dispatch = useDispatch();
	const { aggregations } = useSelector((state) => state.summary);
	useEffect(() => {
		dispatch(fetchSummaryData());
	}, [dispatch]);
	const titleMap = {
		total_runs: "Total jobs",
		success: "Success",
		failure: "Failure",
		pass_rate: "Success Rate",
	};
	return (
		<>
			<Card>
				<CardBody>
					<Grid hasGutter>
						{aggregations?.summary &&
							Object.entries(aggregations.summary).map(([key, value]) => {
								return (
									<GridItem key={key} span={3}>
										<MetricCard
											key={key}
											title={titleMap[key]}
											footer={value}
										/>
									</GridItem>
								);
							})}
					</Grid>
				</CardBody>
			</Card>
			<Grid hasGutter>
				{Object.keys(aggregations).length > 0 && (
					<>
						<GridItem span={12}>
							<Card>
								<CardBody>
									<ScenarioChart data={aggregations?.scenario_type} />
								</CardBody>
							</Card>
						</GridItem>
						<GridItem span={12}>
							<Card>
								<CardBody>
									<CloudCharts
										cloudType={aggregations?.cloud_type}
										cloudInfra={aggregations?.cloud_infra}
									/>
								</CardBody>
							</Card>
						</GridItem>
						<GridItem span={6}>
							<Card>
								<CardBody>
									<ScenarioRiskTable
										data={aggregations?.scenario_type}
										title={"Scenario Type Performance"}
										column1={"Scenario Type"}
									/>
								</CardBody>
							</Card>
						</GridItem>
						<GridItem span={6}>
							<Card>
								<CardBody>
									<ScenarioRiskTable
										data={aggregations?.cloud_infra}
										title={"Cloud Infrastructure Performance"}
										column1={"Cloud Infra"}
									/>
								</CardBody>
							</Card>
						</GridItem>
						<GridItem span={6}>
							<Card>
								<CardBody>
									<MajorVersionCharts data={aggregations?.major_version} />
								</CardBody>
							</Card>
						</GridItem>
						<GridItem span={6}>
							<Card>
								<CardBody>
									<ScenarioRiskTable
										data={aggregations?.major_version}
										title={"Major version Breakdown"}
										column1={"Version"}
									/>
								</CardBody>
							</Card>
						</GridItem>
					</>
				)}
			</Grid>
		</>
	);
};

export default Summary;
