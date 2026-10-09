import { Check, Loader2, X } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";

const LeaveHistory = ({ leaves, isAdmin, onUpdate }) => {
  const [processing, setProcessing] = useState(null);

  const handleStatusUpdate = async (id, status) => {
    setProcessing({ id, status });
    try {
      await onUpdate(id, status);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to update leave status.",
      );
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (value, includeYear = false) => {
    const dateKey = String(value).slice(0, 10);
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return "N/A";

    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "2-digit",
      ...(includeYear ? { year: "numeric" } : {}),
    }).format(date);
  };

  const leaveList = Array.isArray(leaves) ? leaves : [];

  return (
    <div className="card overflow-hidden">
      <div className="overflow-y-auto">
        <table className="table-modern">
          <thead>
            <tr>
              {isAdmin && <th>Employee</th>}
              <th>Type</th>
              <th>Dates</th>
              <th>Reason</th>
              <th>Status</th>
              {isAdmin && <th className="text-center">Action</th>}
            </tr>
          </thead>
          <tbody>
            {leaveList.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 6 : 4}
                  className="text-center py-12 text-slate-400"
                >
                  No leave Application Found
                </td>
              </tr>
            ) : (
              leaveList.map((leave) => {
                const employee = Array.isArray(leave.employee)
                  ? leave.employee[0]
                  : leave.employee;

                return (
                  <tr key={leave._id || leave.id}>
                    {isAdmin && (
                      <td className="text-slate-900">
                        {employee?.firstName} {employee?.lastName}
                      </td>
                    )}

                    <td>
                      <span className="badge bg-slate-100 text-slate-600">
                        {leave.type}
                      </span>
                    </td>

                    <td className="text-xs text-slate-500">
                      {formatDate(leave.startDate)} -{" "}
                      {formatDate(leave.endDate, true)}
                    </td>

                    <td
                      className="max-w-xs truncate text-slate-500"
                      title={leave.reason}
                    >
                      {leave.reason}
                    </td>

                    <td>
                      <span
                        className={`badge ${leave.status === "APPROVED" ? "badge-success" : leave.status === "REJECTED" ? "badge-danger" : "badge-warning"}`}
                      >
                        {leave.status}
                      </span>
                    </td>

                    {isAdmin && (
                      <td>
                        {leave.status === "PENDING" && (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() =>
                                handleStatusUpdate(
                                  leave._id || leave.id,
                                  "APPROVED",
                                )
                              }
                              type="button"
                              disabled={!!processing}
                              aria-label="Approve leave"
                              className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            >
                              {processing?.id === (leave._id || leave.id) &&
                              processing.status === "APPROVED" ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              onClick={() =>
                                handleStatusUpdate(
                                  leave._id || leave.id,
                                  "REJECTED",
                                )
                              }
                              type="button"
                              disabled={!!processing}
                              aria-label="Reject leave"
                              className="p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            >
                              {processing?.id === (leave._id || leave.id) &&
                              processing.status === "REJECTED" ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveHistory;
