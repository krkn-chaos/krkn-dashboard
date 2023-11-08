import { Card, CardBody } from "@patternfly/react-core";

import ScenariosList from "@/components/molecules/ScenariosList";

const ScenariosCard = () => {
  return (
    <Card>
      <CardBody>
        <ScenariosList />
      </CardBody>
    </Card>
  );
};

export default ScenariosCard;
