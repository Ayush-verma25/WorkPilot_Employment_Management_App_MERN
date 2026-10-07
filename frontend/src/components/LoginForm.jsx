import { useState } from "react";
import LoginLeftSide from "./LoginLeftSide";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, saveAuth } from "../lib/api";

const LoginForm = ({ role, title, subtitle }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          role_type: role,
        }),
      });
      saveAuth(result);
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <LoginLeftSide />
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-linear-to-br from-white via-emerald-50/50 to-white">
        <div className="w-full max-w-md animate-fade-in">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 text-sm mb-10 transition-colors"
          >
            <ArrowLeftIcon size={16} /> Back to Portals
          </Link>

          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-3">
              {role === "admin" ? "Administrator access" : "Employee access"}
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
              {subtitle}
            </p>
          </div>

          <form
            className="space-y-6"
            onSubmit={handleSubmit}
          >
            <fieldset disabled={loading} className="space-y-6">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="john@example.com"
                autoComplete="username"
                required
                className="rounded-lg border-slate-200 bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="rounded-lg border-slate-200 bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            </fieldset>
          </form>
        </div>
      </div>
      {/* <div className="w-full max-w-md animate-fade-in">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm mb-10 transition-colors"
        >
          <ArrowLeftIcon className="size-{16}" /> Back to Portals!
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-medium text-zinc-800">
            {title}
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-2">{subtitle}</p>
        </div>
      </div> */}
    </div>
  );
};

export default LoginForm;
