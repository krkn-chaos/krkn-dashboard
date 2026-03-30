import "./index.less";
import React from "react";
import { Card, CardFooter, CardTitle } from "@patternfly/react-core";

import PropTypes from "prop-types";

const MetricCard = (props) => {
	return (
		<Card ouiaId={props.title} className="card-class">
			<CardTitle className="title">{props.title}</CardTitle>
			<CardFooter className="count-value">{props.footer}</CardFooter>
		</Card>
	);
};

MetricCard.propTypes = {
	title: PropTypes.string,
	footer: PropTypes.number,
};
export default MetricCard;
