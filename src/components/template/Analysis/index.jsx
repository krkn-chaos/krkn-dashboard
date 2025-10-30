import { Tabs, Tab, TabContent, TabTitleText } from "@patternfly/react-core";
import React from "react";
import Summary from "../Summary/index";
import AlertAnalysis from "../AlertAnalysis/index";
const Analysis = () => {
	return (
		<Tabs defaultActiveKey={0} aria-label="Analysis Tabs">
			<Tab eventKey={0} title={<TabTitleText>Summary</TabTitleText>}>
				<TabContent>
					<Summary />
				</TabContent>
			</Tab>
			<Tab eventKey={1} title={<TabTitleText>Alert Analysis</TabTitleText>}>
				<TabContent>
					<AlertAnalysis />
				</TabContent>
			</Tab>
		</Tabs>
	);
};

export default Analysis;
