import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "");

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">My Profile</h1>

      <div className="max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        {/* Avatar */}
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500 text-xl font-bold text-white uppercase">
            {initials || "?"}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">
          {[
           { label: "First Name", value: user?.firstName },
          { label: "Last Name",  value: user?.lastName },
           { label: "Email",      value: user?.email },
          { label: "Role", value: typeof user?.role === "object" ? (user?.role as any)?.name : user?.role },
         ...(user?.phone ? [{ label: "Phone", value: user.phone }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1 border-b border-gray-100 pb-3 last:border-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {label}
              </p>
              <p className="text-sm font-medium text-gray-800">{value}</p>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-6 w-full rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
        >
          Logout
        </button>

      </div>
    </div>
  );
}