import { User } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { apiRequest } from "../lib/api";

const ProfileForm = ({ initialData }) => {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const bio = new FormData(event.currentTarget).get("bio");
    try {
      await apiRequest("/api/profile", {
        method: "POST",
        body: JSON.stringify({ bio }),
      });
      toast.success("Bio saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save bio.");
    } finally {
      setSaving(false);
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
              disabled
              value={`${initialData.firstName} ${initialData.lastName}`}
              className="bg-slate-50 text-slate-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              disabled
              value={initialData.email}
              className="bg-slate-50 text-slate-400 cursor-not-allowed"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Position
            </label>
            <input
              disabled
              value={initialData.position}
              className="bg-slate-50 text-slate-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Bio
          </label>
          <textarea
            disabled={!initialData._id || initialData.isDeleted || saving}
            name="bio"
            defaultValue={initialData.bio || ""}
            placeholder="Write a brief bio..."
            className={`resize-none ${!initialData._id || initialData.isDeleted ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}`}
          />
          <p className="text-xs text-slate-400 mt-1.5">
            This will be shown on your public profile
          </p>
        </div>
        {initialData._id && !initialData.isDeleted && (
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        )}
        {initialData.isDeleted && (
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
