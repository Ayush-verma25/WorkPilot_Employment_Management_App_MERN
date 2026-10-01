import LoginLeftSide from "./LoginLeftSide";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";

const LoginForm = ({ role, title, subtitle }) => {
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

          <div
            role="status"
            className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
          >
            <p className="text-sm font-semibold text-emerald-900">
              Sign-in unavailable
            </p>
            <p className="mt-1 text-sm leading-relaxed text-emerald-800">
              Authentication has not been configured for this application yet.
            </p>
          </div>

          <form
            className="space-y-6"
            onSubmit={(event) => event.preventDefault()}
          >
            <fieldset disabled className="space-y-6">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="john@example.com"
                autoComplete="username"
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
                  type="password"
                  autoComplete="current-password"
                  className="rounded-lg border-slate-200 bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-emerald-600 py-3 text-sm font-semibold text-white opacity-50 shadow-lg shadow-emerald-500/25"
            >
              Sign-in unavailable
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
