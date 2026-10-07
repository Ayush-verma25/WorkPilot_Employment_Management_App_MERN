import { Download } from "lucide-react";
import React from "react";
import { format } from "date-fns";

const PayslipList = ({ payslips, isAdmin }) => {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-y-auto">
        <table className="table-modern">
          <thead>
            <tr>
              {isAdmin && <th>Employee</th>}
              <th>Period</th>
              <th>Basic Salary</th>
              <th>Net Salary</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payslips.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 6 : 4}
                  className="text-center py-12 text-slate-400"
                >
                  No payslip Found
                </td>
              </tr>
            ) : (
              payslips.map((payslip) => {
                return (
                  <tr key={payslip._id || payslip.id}>
                    {isAdmin && (
                      <td className="text-slate-900">
                        {payslip?.employee?.firstName}{" "}
                        {payslip?.employee?.lastName}
                      </td>
                    )}

                    <td className="text-slate-500">
                      {format(
                        new Date(payslip.year, payslip.month - 1),
                        "MMMM yyyy",
                      )}
                    </td>

                    <td className="text-slate-500">
                      ₹{payslip.basicSalary?.toLocaleString()}
                    </td>

                    <td className="font-medium text-slate-800">
                      ₹{payslip.netSalary?.toLocaleString()}
                    </td>

                    <td className="max-w-xs truncate text-slate-500">
                      <button
                        onClick={() =>
                          window.open(
                            `/print/payslips/${payslip._id || payslip.id}`,
                          )
                        }
                        className="inline-flex items-center px-3 text-xs font-medium rounded text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors ring-1 ring-emerald-600/10"
                      >
                        <Download className="w-3 h-3 mr-1.5" /> Download
                      </button>
                    </td>
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

export default PayslipList;
