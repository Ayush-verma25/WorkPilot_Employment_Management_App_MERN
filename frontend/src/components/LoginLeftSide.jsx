import React from "react";
import logo from "../assets/logo.svg";

const LoginLeftSide = () => {
  return (
    <div className="hidden md:flex w-1/2 bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-950 relative overflow-hidden border-r border-emerald-900">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-emerald-400/10 via-transparent to-teal-500/10"></div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 75% 65% at 0% 0%, rgba(110, 231, 183, 0.28), transparent 72%)",
        }}
      ></div>

      <img
        src={logo}
        alt="WorkPilot"
        className="absolute left-12 top-8 lg:left-20 lg:top-10 z-10 w-56 lg:w-64 h-auto"
      />

      <div className="relative z-10 flex flex-col items-start justify-center p-12 lg:p-20 w-full h-full">
        <h1 className="text-4xl lg:text-5xl font-medium text-emerald-50 mb-6 leading-tight tracking-tight">
          Employee <br /> Management System
        </h1>
        <p className="text-emerald-100/75 text-lg max-w-md leading-relaxed">
          Streamline your employee management with our intuitive and
          user-friendly interface.
        </p>
      </div>
    </div>
  );
};

export default LoginLeftSide;
