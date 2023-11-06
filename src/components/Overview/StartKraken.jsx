import "./index.less";

import { Button, Modal, ModalVariant } from "@patternfly/react-core";
import React, { useState } from "react";

import NewExperiment from "@/components/NewExperiment/index";
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
      {isModalOpen && (
        <NewKrakenModal
          isModalOpen={isModalOpen}
          handleModalToggle={handleModalToggle}
        />
      )}
    </div>
  );
};

const NewKrakenModal = (props) => {
  return (
    <Modal
      className="new-kraken-modal"
      variant={ModalVariant.medium}
      title="Start Kraken"
      description="Let's start Kraken with cerberus enabled and inject pod failures"
      isOpen={props.isModalOpen}
      onClose={props.handleModalToggle}
    >
      <NewExperiment closeModal={props.handleModalToggle} />
    </Modal>
  );
};
export default StartKraken;
