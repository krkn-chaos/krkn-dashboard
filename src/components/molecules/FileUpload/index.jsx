import { fileUpload, updateFileContent } from "@/actions/newExperiment";

import { FileUpload } from "@patternfly/react-core";
import React from "react";
import { useDispatch } from "react-redux";

const KubeconfigFileUpload = ({ isDisabled = false }) => {
  const dispatch = useDispatch();
  const [filename, setFilename] = React.useState("");
  const [value, setValue] = React.useState(null);

  const handleFileInputChange = (_, file) => {
    if (isDisabled) {
      return;
    }
    setFilename(file.name);
    dispatch(fileUpload(file));
    dispatch(updateFileContent(true));
  };
  const handleClear = () => {
    if (isDisabled) {
      return;
    }
    setFilename("");
    setValue("");
    dispatch(updateFileContent(""));
  };
  return (
    <div
      className={`file-path-container${isDisabled ? " file-path-container--disabled" : ""}`}
    >
      <FileUpload
        id="simple-file"
        value={value}
        filename={filename}
        filenamePlaceholder="Upload kubeconfig file"
        onFileInputChange={handleFileInputChange}
        onClearClick={handleClear}
        browseButtonText="Upload"
        isDisabled={isDisabled}
      />
    </div>
  );
};

export default KubeconfigFileUpload;
