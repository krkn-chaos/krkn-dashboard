import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

import * as APP_ROUTES from "@/utils/routeConstants";
import { pathForMenuKey } from "@/utils/navPaths";

const AdminRoute = () => {
  const user = useSelector((state) => state.auth.user);

  if (user?.role !== "admin") {
    return (
      <Navigate
        to={pathForMenuKey(APP_ROUTES.SETTINGS)}
        replace
      />
    );
  }

  return <Outlet />;
};

export default AdminRoute;
