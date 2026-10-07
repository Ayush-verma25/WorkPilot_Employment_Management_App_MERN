import React, { useCallback, useEffect, useState } from "react";
import Loading from "../components/Loading";
import PayslipList from "../components/payslip/PayslipList";
import GeneratePayslipForm from "../components/payslip/GeneratePayslipForm";
import toast from "react-hot-toast";
import { apiRequest, getAuthUser } from "../lib/api";

const Payslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = getAuthUser()?.role === "ADMIN";

  const fetchPayslips = useCallback(async () => {
    try {
      const [payslipResult, employeeResult] = await Promise.all([
        apiRequest("/api/payslips"),
        isAdmin ? apiRequest("/api/employees") : Promise.resolve([]),
      ]);
      setPayslips(payslipResult.data || []);
      setEmployees(employeeResult);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchPayslips().catch((error) => {
      toast.error(error instanceof Error ? error.message : "Failed to load payslips.");
    });
  }, [fetchPayslips]);

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="page-title">Payslips</h1>
          <p className="page-subtitle">
            {isAdmin
              ? "Generate and manage employee payslips"
              : "Your paySlip history"}
          </p>
        </div>
        {isAdmin && 
          <GeneratePayslipForm
            employees={employees}
            onSuccess={fetchPayslips}
          />
        }
      </div>
      <PayslipList payslips={payslips} isAdmin={isAdmin} />
    </div>
  );
};

export default Payslips;
