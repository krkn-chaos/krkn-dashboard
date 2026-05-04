import "./App.css";

import * as APP_ROUTES from "./utils/routeConstants";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import React, { useEffect } from "react";

import History from "@/components/template/History";
import MainLayout from "@/container/MainLayout";
import MetricsStorage from "@/components/template/MetricsStorage";
import Overview from "@/components/Overview";
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
            <Route path={APP_ROUTES.HISTORY} element={<History />} />
            <Route path={APP_ROUTES.RESULTS} element={<Results />} />
            <Route path={APP_ROUTES.METRICS} element={<MetricsStorage />} />
            <Route path={APP_ROUTES.SUMMARY} element={<Analysis />} />
            <Route index element={<Overview />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
