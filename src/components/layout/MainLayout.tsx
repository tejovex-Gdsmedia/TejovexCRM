import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto bg-gray-100 dark:bg-[#111318] p-6 transition-colors duration-300">

        {/* Watermark */}
        <div className="pointer-events-none fixed inset-0 left-56 flex items-center justify-center z-0">
          <img
            src="/Tejovexlogo.png"
            alt=""
            className="w-96 opacity-15 select-none"
          />
        </div>

        <div className="relative z-10">
          <Outlet />
        </div>

      </main>
    </div>
  );
}