import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { dummyProfileData } from "../assets/assets";

const Layout = () => {
  return (
    <div className="flex h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50/30">
      <Sidebar role={dummyProfileData.role} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 sm:p-6 sm:pt-6 lg:p-8 max-w-400 mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
