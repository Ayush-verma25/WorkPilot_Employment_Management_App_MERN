import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import { Lock } from "lucide-react";
import ProfileForm from "../components/ProfileForm";
import ChangePasswordModal from "../components/ChangePasswordModal";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProfile = async () => {
      setLoading(true);
      setProfile(null);
      try {
        const { data } = await api.get("/profile", {
          signal: controller.signal,
        });
        if (!data || typeof data !== "object") {
          throw new Error("The server returned invalid profile data.");
        }
        setProfile(data);
      } catch (error) {
        if (controller.signal.aborted) return;
        toast.error(
          error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "Failed to load profile.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchProfile();
    return () => controller.abort();
  }, [user?.userId]);

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      {profile && <ProfileForm initialData={profile} />}

      {/* Change Password trigger */}
      <div className="card max-w-md p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 rounded-lg">
            <Lock className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Password</p>
            <p className="text-sm text-slate-500">
              Update your Account password
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="btn-secondary text-sm"
        >
          Change
        </button>
      </div>
      <ChangePasswordModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};

export default Settings;
