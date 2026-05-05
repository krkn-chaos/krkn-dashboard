import "./App.css";

import * as APP_ROUTES from "./utils/routeConstants";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import React, { useEffect } from "react";

import MainLayout from "@/container/MainLayout";
import Overview from "@/components/Overview";
import PastRuns from "@/components/template/PastRuns";
import Results from "@/components/template/Results";
import Analysis from "@/components/template/Analysis";
import { checkPodmanInstalled } from "@/actions/newExperiment.js";
import { useDispatch } from "react-redux";

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(checkPodmanInstalled());
  }, []);
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path={APP_ROUTES.OVERVIEW} element={<Overview />} />
            <Route path={APP_ROUTES.RESULTS} element={<Results />} />
            <Route path={APP_ROUTES.ELASTIC_RUNS} element={<Analysis />} />
            <Route path={APP_ROUTES.PAST_RUNS} element={<PastRuns />} />
            <Route index element={<Overview />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
