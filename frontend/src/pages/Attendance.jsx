import React, { useCallback, useEffect, useState } from "react";
import Loading from "../components/Loading";
import CheckInButton from "../components/attendance/CheckInButton";
import AttendanceStats from "../components/attendance/AttendanceStats";
import AttendanceHistory from "../components/attendance/AttendanceHistory";
import toast from "react-hot-toast";
import { apiRequest } from "../lib/api";

const indiaDateKey = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
};

const Attendance = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);
  const [todayKey] = useState(indiaDateKey);

  const fetchData = useCallback(async () => {
    try {
      const result = await apiRequest("/api/attendance");
      setHistory(result.data || []);
      setIsDeleted(Boolean(result.employee?.isDeleted));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData().catch((error) => {
      toast.error(error instanceof Error ? error.message : "Failed to load attendance.");
    });
  }, [fetchData]);

  if (loading) return <Loading />;

  const todayRecord = history.find((record) =>
    String(record.date).slice(0, 10) === todayKey,
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">
          Track your work hours and daily check-ins
        </p>
      </div>

      {isDeleted ? (
        <div className="mb-8 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <p className="text-rose-600">
            You can no longer clock in or out because your employee records have
            been marked as deleted.
          </p>
        </div>
      ) : (
        <div className="mb-8">
          <CheckInButton todayRecord={todayRecord} onAction={fetchData} />
        </div>
      )}

      <AttendanceStats history={history} />
      <AttendanceHistory history={history} />
    </div>
  );
};

export default Attendance;
