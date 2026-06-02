import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchCurrentUser, fetchRunGroups } from "@/actions/authActions";

const ProtectedRoute = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (user) {
      dispatch(fetchRunGroups());
    }
  }, [dispatch, user]);

  if (loading) {
    return (
      <div className="auth-loading pf-v5-u-p-lg pf-v5-u-text-align-center">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
