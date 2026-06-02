import "./App.css";

import * as APP_ROUTES from "./utils/routeConstants";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import React, { useEffect } from "react";

import Login from "@/components/Login";
import MainLayout from "@/container/MainLayout";
import Overview from "@/components/Overview";
import PastRuns from "@/components/template/PastRuns";
import Results from "@/components/template/Results";
import Analysis from "@/components/template/Analysis";
import ProtectedRoute from "@/components/ProtectedRoute";
import Settings from "@/components/template/Settings";
import Administration from "@/components/template/Settings/Administration";
import GroupManagePage from "@/components/template/Settings/GroupManagePage";
import AdminRoute from "@/components/AdminRoute";
import { checkPodmanInstalled } from "@/actions/newExperiment.js";
import { useDispatch } from "react-redux";

function AppRoutes() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(checkPodmanInstalled());
  }, [dispatch]);

  return (
    <Routes>
      <Route path={`/${APP_ROUTES.LOGIN}`} element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path={APP_ROUTES.OVERVIEW} element={<Overview />} />
          <Route path={APP_ROUTES.RESULTS} element={<Results />} />
          <Route path={APP_ROUTES.ELASTIC_RUNS} element={<Analysis />} />
          <Route path={APP_ROUTES.PAST_RUNS} element={<PastRuns />} />
          <Route path={APP_ROUTES.SETTINGS} element={<Settings />} />
          <Route path={APP_ROUTES.GROUP_MANAGE} element={<GroupManagePage />} />
          <Route element={<AdminRoute />}>
            <Route
              path={APP_ROUTES.ADMINISTRATION}
              element={<Administration />}
            />
          </Route>
          <Route index element={<Overview />} />
        </Route>
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </div>
  );
}

export default App;
