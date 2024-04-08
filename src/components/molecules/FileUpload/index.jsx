import { fileUpload, updateFileContent } from "@/actions/newExperiment";

import { FileUpload } from "@patternfly/react-core";
import React from "react";
import { useDispatch } from "react-redux";

const KubeconfigFileUpload = () => {
  const dispatch = useDispatch();
  const [filename, setFilename] = React.useState("");
  const [value, setValue] = React.useState(null);

  const handleFileInputChange = (_, file) => {
    setFilename(file.name);
    dispatch(fileUpload(file));
  };
  const handleClear = () => {
    setFilename("");
    setValue("");
    dispatch(updateFileContent(""));
  };
  return (
    <>
      <FileUpload
        id="simple-file"
        value={value}
        filename={filename}
        filenamePlaceholder="Upload kubeconfig file"
        onFileInputChange={handleFileInputChange}
        onClearClick={handleClear}
        browseButtonText="Upload"
      />
    </>
  );
};

export default KubeconfigFileUpload;
