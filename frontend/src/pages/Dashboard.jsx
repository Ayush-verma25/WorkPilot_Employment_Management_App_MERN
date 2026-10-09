import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import EmployeeDashboard from "../components/EmployeeDashboard";
import AdminDashboard from "../components/AdminDashboard";
import api from "../api/axios";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setData(res.data))
      .catch((error) =>
        toast.error(
          error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            "Failed to load dashboard.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!data)
    return (
      <p className="text-center text-emerald-500 py-12">Failed to load data</p>
    );

  if (data.role === "ADMIN") {
    return <AdminDashboard data={data} />;
  } else {
    return <EmployeeDashboard data={data} />;
  }
};

export default Dashboard;
