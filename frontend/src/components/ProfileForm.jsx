import React, { useState } from "react";
import { Loader2, Save, User } from "lucide-react";
import api from "../api/axios";

const ProfileForm = ({ initialData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canEdit = Boolean(initialData?._id) && !initialData?.isDeleted;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const bio = new FormData(e.currentTarget).get("bio");
    try {
      await api.put("/profile", { bio });
      setMessage("Profile updated successfully.");
      await onSuccess?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to save profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5 sm:p-6 mb-6">
      <h2 className="text-base font-medium text-slate-900 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
        <User className="w-5 h-5 text-slate-400" /> Public Profile
      </h2>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Name
            </label>
            <input
              type="text"
              disabled
              value={`${initialData?.firstName || ""} ${initialData?.lastName || ""}`.trim()}
              className="bg-slate-50 text-slate-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              disabled
              value={initialData?.email || ""}
              className="bg-slate-50 text-slate-400 cursor-not-allowed"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Position
            </label>
            <input
              type="text"
              disabled
              value={initialData?.position || ""}
              className="bg-slate-50 text-slate-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Bio
          </label>
          <textarea
            disabled={!canEdit || loading}
            name="bio"
            defaultValue={initialData?.bio || ""}
            placeholder="Write a brief bio..."
            className={`resize-none ${!canEdit || loading ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}`}
          />
          <p className="text-xs text-slate-400 mt-1.5">
            This will be shown on your public profile
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm text-emerald-600">
            {message}
          </p>
        )}
        {canEdit && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save changes
                </>
              )}
            </button>
          </div>
        )}
        {initialData?.isDeleted && (
          <div className="pt-2">
            <div className="p-4 bg-rose-50 border- border-rose-200 rounded-xl text-center">
              <p className="text-rose-600 font-medium tracking-tight">
                Account Deactivated
              </p>
              <p className="text-sm text-rose-500 mt-0.5">
                You can no longer update your profile
              </p>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default ProfileForm;
