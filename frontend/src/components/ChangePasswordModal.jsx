import { LockIcon, X } from "lucide-react";
import React, { useEffect, useId, useRef, useState } from "react";
import toast from "react-hot-toast";
import { apiRequest } from "../lib/api";

const ChangePasswordModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef(null);
  const titleId = useId();
  const currentPasswordId = useId();
  const newPasswordId = useId();

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    dialog.showModal();
    dialog.querySelector("input").focus();

    return () => {
      dialog.close();
      previousFocus?.focus();
    };
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    try {
      await apiRequest("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: form.get("currentPassword"),
          newPassword: form.get("newPassword"),
        }),
      });
      toast.success("Password updated successfully.");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;

        const controls = e.currentTarget.querySelectorAll(
          "button:not(:disabled), input:not(:disabled)",
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }}
      onClick={onClose}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent open:flex items-center justify-center p-4 backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-0">
          <h2
            id={titleId}
            className="text-lg font-medium text-slate-900 flex items-center gap-2"
          >
            <LockIcon className="w-5 h-5 text-slate-400" /> Change Password
          </h2>
          <button
            type="button"
            aria-label="Close change password dialog"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="p-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor={currentPasswordId}
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Current Password
            </label>
            <input
              id={currentPasswordId}
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label
              htmlFor={newPasswordId}
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              New Password
            </label>
            <input
              id={newPasswordId}
              type="password"
              name="newPassword"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex justify-center items-center gap-2"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};

export default ChangePasswordModal;
