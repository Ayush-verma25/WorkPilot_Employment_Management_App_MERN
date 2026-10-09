import { Loader2Icon, LockIcon, X } from "lucide-react";
import React, { useEffect, useId, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

const ChangePasswordModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const dialogRef = useRef(null);
  const formRef = useRef(null);
  const titleId = useId();
  const currentPasswordId = useId();
  const newPasswordId = useId();

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.showModal();
    dialog?.querySelector("input")?.focus();

    return () => {
      if (dialog?.open) dialog.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open]);

  const handleClose = () => {
    if (loading) return;
    setMessage({ type: "", text: "" });
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");

    try {
      const { data } = await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      if (!data?.success)
        throw new Error(data.error || "Failed to update password.");
      formRef.current?.reset();
      toast.success("Password updated successfully.");
      onClose();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to update password.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
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
            onClick={handleClose}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          ref={formRef}
          className="p-6 space-y-5"
          onSubmit={handleSubmit}
        >
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

          {message.text && (
            <p
              role="alert"
              className="text-sm text-rose-600"
            >
              {message.text}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex justify-center items-center gap-2"
            >
              {loading && <Loader2Icon className="h-4 w-4 animate-spin" />}
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};

export default ChangePasswordModal;
