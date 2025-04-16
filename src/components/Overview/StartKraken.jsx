import "./index.less";

import React, { useState } from "react";

import { Button } from "@patternfly/react-core";
import kraken from "@/assets/logo/kraken_logo_black_and_white.svg";

const StartKraken = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const handleModalToggle = () => {
    setModalOpen(!isModalOpen);
  };

  return (
    <div className="kraken-wrapper">
      <div>
        <img className="kraken-logo" src={kraken} />
      </div>
      <div>
        <h4 className="title">Inject pod failures</h4>
        <Button
          variant="tertiary"
          className="third"
          onClick={handleModalToggle}
        >
          Start Kraken
        </Button>
      </div>
    </div>
  );
};

export default StartKraken;
