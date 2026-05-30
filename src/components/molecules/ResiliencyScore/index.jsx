import "./index.less";

import React from "react";
import PropTypes from "prop-types";
import {
  Progress,
  ProgressMeasureLocation,
  ProgressSize,
  ProgressVariant,
} from "@patternfly/react-core";

/** Green >= 90, amber 70-89, red < 70 — see resiliency-score docs. */
const variantForScore = (score) => {
  if (score >= 90) return ProgressVariant.success;
  if (score >= 70) return ProgressVariant.warning;
  return ProgressVariant.danger;
};

/**
 * Renders a krkn resiliency score as a threshold-colored progress bar.
 * `resiliency` is the normalized shape produced server-side:
 *   { score, passedSlos, totalSlos, scenarios: [{ name, score }] }
 * `variant` "compact" suits a table cell; "detailed" adds the SLO and
 * per-scenario breakdown for expanded rows / detail panels.
 */
const ResiliencyScore = ({ resiliency, variant = "compact", title = "Resiliency Score" }) => {
  const hasScore = resiliency && typeof resiliency.score === "number";

  if (!hasScore) {
    return (
      <span className="resiliency-score__empty">
        {variant === "detailed" ? "No resiliency data" : "—"}
      </span>
    );
  }

  const { score, passedSlos, totalSlos, scenarios = [] } = resiliency;

  if (variant === "compact") {
    return (
      <div className="resiliency-score resiliency-score--compact">
        <Progress
          value={score}
          size={ProgressSize.sm}
          measureLocation={ProgressMeasureLocation.outside}
          variant={variantForScore(score)}
          aria-label={`${title}: ${score} percent`}
        />
      </div>
    );
  }

  return (
    <div className="resiliency-score resiliency-score--detailed">
      <Progress
        title={title}
        value={score}
        measureLocation={ProgressMeasureLocation.outside}
        variant={variantForScore(score)}
        aria-label={`${title}: ${score} percent`}
      />
      {passedSlos != null && totalSlos != null && (
        <div className="resiliency-score__slos">
          Passed SLOs: {passedSlos} / {totalSlos}
        </div>
      )}
      {scenarios.length > 0 && (
        <div className="resiliency-score__scenarios">
          {scenarios.map((s) => (
            <div className="resiliency-score__scenario" key={s.name}>
              <span className="resiliency-score__scenario-name" title={s.name}>
                {s.name}
              </span>
              <Progress
                value={s.score}
                size={ProgressSize.sm}
                measureLocation={ProgressMeasureLocation.outside}
                variant={variantForScore(s.score)}
                aria-label={`${s.name}: ${s.score} percent`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ResiliencyScore.propTypes = {
  resiliency: PropTypes.shape({
    score: PropTypes.number,
    passedSlos: PropTypes.number,
    totalSlos: PropTypes.number,
    scenarios: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        score: PropTypes.number,
      })
    ),
  }),
  variant: PropTypes.oneOf(["compact", "detailed"]),
  title: PropTypes.string,
};

export default ResiliencyScore;
