import { useTheme } from "../../context/ThemeContext";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard, Users, Building2, Star,
  GitPullRequest, CheckSquare, FileText, UserCircle, LogOut,
  CalendarClock, Mail, BarChart3, X, Settings, Sun, Moon,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";




const navItems = [
  {
    section: "MAIN",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    section: "MODULES",
    items: [
      { label: "Contacts",         to: "/contacts",  icon: Users },
      { label: "Companies",        to: "/companies", icon: Building2 },
      { label: "Leads",            to: "/leads",     icon: Star },
      { label: "Deals / Pipeline", to: "/deals",     icon: GitPullRequest },
      { label: "Tasks",            to: "/tasks",     icon: CheckSquare },
      { label: "Notes",            to: "/notes",     icon: FileText },
      { label: "Follow-Ups",       to: "/followups",        icon: CalendarClock },
      { label: "Email Templates",  to: "/email-templates",  icon: Mail },
      { label: "Analytics", to: "/analytics", icon: BarChart3 },
    ],
  },
  {
    section: "ACCOUNT",
    items: [
      { label: "Profile",  to: "/profile",  icon: UserCircle },
      { label: "Settings", to: "/settings", icon: Settings  },
    ],
  },
];



export default function Sidebar() {
  const { user, logout } = useAuth();
const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials =
    (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "");

  return (
    <aside className="flex h-screen w-56 flex-col bg-sidebar dark:bg-sidebar-dark text-white flex-shrink-0 transition-colors duration-300">


{/* Logo */}
<div className="flex items-center gap-3 px-4 py-5">
  <img
    src="/Tejovexlogo.png"
    alt="Tejovex Logo"
    className="h-9 w-9 flex-shrink-0 rounded-lg object-contain"
    style={{ minWidth: '36px', maxWidth: '36px' }}
  />
  <div className="min-w-0">
    <p className="text-sm font-semibold leading-tight truncate">Tejovex</p>
    <p className="text-[10px] text-gray-400 tracking-widest">CRM PLATFORM</p>
  </div>
</div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navItems.map((group) => (
          <div key={group.section} className="mb-4">
            <p className="mb-1 px-2 text-[10px] font-semibold tracking-widest text-gray-500">
              {group.section}
            </p>
            {group.items.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-brand-600 text-white"
                      : "text-gray-400 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User strip */}
      <div className="border-t border-white/10 px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold uppercase">
            {initials || "?"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium leading-tight">
             {user ? `${user.firstName} ${user.lastName}` : "Loading…"}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-gray-400">
             {typeof user?.role === "object" ? user?.role?.name : user?.role ?? ""}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            title="Logout"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-[#2e3245] rounded-xl shadow-2xl w-full max-w-sm p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Logout</h3>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to logout? You will need to sign in again to access your account.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#2e3245] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1e2235] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </aside>
  );
}
