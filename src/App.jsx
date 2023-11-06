import "./App.css";

import * as APP_ROUTES from "./utils/routeConstants";

import { BrowserRouter, Route, Routes } from "react-router-dom";

import MainLayout from "@/container/MainLayout";
import Overview from "@/components/Overview";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path={APP_ROUTES.OVERVIEW} element={<Overview />} />
            <Route index element={<Overview />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
