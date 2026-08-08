import { useState, useEffect } from "react";
import { Users, Briefcase, Star, CheckSquare } from "lucide-react";

const BASE = import.meta.env.VITE_API_URL;

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

interface Lead {
  id: string;
  title: string;
  status: string;
  source: string;
  value?: number;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  completed: boolean;
}

interface Stats {
  totalContacts: number;
  openDeals: number;
  openDealsValue: number;
  activeLeads: number;
  pendingTasks: number;
  tasksDueToday: number;
  newContactsThisMonth: number;
  newDealsThisMonth: number;
  unqualifiedLeads: number;
  todayFollowUps: number;
  overdueFollowUps: number;
}

const statusColors: Record<string, string> = {
  NEW:         "bg-blue-100 text-blue-700",
  QUALIFIED:   "bg-yellow-100 text-yellow-700",
  CONTACTED:   "bg-purple-100 text-purple-700",
  CONVERTED:   "bg-green-100 text-green-700",
  UNQUALIFIED: "bg-red-100 text-red-700",
};

const priorityColors: Record<string, string> = {
  HIGH:   "text-red-500",
  MEDIUM: "text-yellow-500",
  LOW:    "text-green-500",
};

function formatValue(val?: number) {
  if (!val) return "—";
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000)   return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short",
  });
}

export default function Dashboard() {
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [myTasks,     setMyTasks]     = useState<Task[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  useEffect(() => {
    const headers = authHeaders();
    Promise.all([
      fetch(`${BASE}/contacts`, { headers }).then(r => r.json()),
      fetch(`${BASE}/deals`,    { headers }).then(r => r.json()),
      fetch(`${BASE}/leads`,    { headers }).then(r => r.json()),
      fetch(`${BASE}/tasks`,    { headers }).then(r => r.json()),
      fetch(`${BASE}/followups/stats`, { headers }).then(r => r.json()),
    ])
      .then(([contacts, deals, leads, tasks, followupStats]) => {
        const contactList = Array.isArray(contacts) ? contacts : contacts?.data ?? [];
        const now = new Date();
        const newContactsThisMonth = contactList.filter((c: any) => {
          const d = new Date(c.createdAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;

        const dealList = Array.isArray(deals) ? deals : deals?.data ?? [];
        const openDeals = dealList.filter((d: any) => d.stage !== "CLOSED_WON" && d.stage !== "CLOSED_LOST");
        const openDealsValue = openDeals.reduce((sum: number, d: any) => sum + (d.value ?? 0), 0);
        const newDealsThisMonth = dealList.filter((d: any) => {
          const date = new Date(d.createdAt);
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length;

        const leadList = Array.isArray(leads) ? leads : leads?.data ?? [];
        const activeLeads = leadList.filter((l: any) => l.status !== "CONVERTED" && l.status !== "UNQUALIFIED");
        const unqualifiedLeads = leadList.filter((l: any) => l.status === "UNQUALIFIED").length;

        const taskList = Array.isArray(tasks) ? tasks : tasks?.data ?? [];
        const pendingTasks = taskList.filter((t: any) => t.status !== "COMPLETED" && t.status !== "CANCELLED");
        const today = new Date().toDateString();
        const tasksDueToday = pendingTasks.filter((t: any) =>
          new Date(t.dueDate).toDateString() === today
        ).length;

        setStats({
          totalContacts:       contactList.length,
          openDeals:           openDeals.length,
          openDealsValue,
          activeLeads:         activeLeads.length,
          pendingTasks:        pendingTasks.length,
          tasksDueToday,
          newContactsThisMonth,
          newDealsThisMonth,
          unqualifiedLeads,
          todayFollowUps: followupStats?.data?.todayCount ?? 0,
          overdueFollowUps: followupStats?.data?.overdueCount ?? 0,
        });

        setRecentLeads(leadList.slice(0, 5));
        setMyTasks(pendingTasks.slice(0, 6).map((t: any) => ({
          ...t,
          completed: t.status === "COMPLETED",
        })));
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load dashboard data.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Contacts</p>
            <Users size={18} className="text-gray-300" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats?.totalContacts ?? 0}</p>
          <p className="mt-1 text-xs text-green-600">↑ {stats?.newContactsThisMonth ?? 0} this month</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Open Deals</p>
            <Briefcase size={18} className="text-gray-300" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{formatValue(stats?.openDealsValue)}</p>
          <p className="mt-1 text-xs text-green-600">↑ {stats?.newDealsThisMonth ?? 0} new deals</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Leads</p>
            <Star size={18} className="text-gray-300" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats?.activeLeads ?? 0}</p>
          <p className="mt-1 text-xs text-red-500">↓ {stats?.unqualifiedLeads ?? 0} unqualified</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending Tasks</p>
            <CheckSquare size={18} className="text-gray-300" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats?.pendingTasks ?? 0}</p>
          <p className="mt-1 text-xs text-gray-500">{stats?.tasksDueToday ?? 0} due today</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between mb-3">
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Today's Follow-Ups</p>
  </div>
  <p className="text-3xl font-bold text-gray-800">{stats?.todayFollowUps ?? 0}</p>
  <p className="mt-1 text-xs text-gray-500">due today</p>
</div>

<div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between mb-3">
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Overdue Follow-Ups</p>
  </div>
  <p className="text-3xl font-bold text-gray-800">{stats?.overdueFollowUps ?? 0}</p>
  <p className="mt-1 text-xs text-red-500">needs attention</p>
</div>

      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Recent Leads</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Title</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Source</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Value</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-400">No leads yet</td>
                  </tr>
                ) : (
                  recentLeads.map(lead => (
                    <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">{lead.title}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColors[lead.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600">
                          {lead.source ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{formatValue(lead.value)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">My Tasks</h2>
          </div>
          <div className="divide-y divide-gray-50 px-5">
            {myTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No pending tasks</p>
            ) : (
              myTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 py-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={async () => {
                      const newStatus = task.completed ? "PENDING" : "COMPLETED";
                      await fetch(`${BASE}/tasks/${task.id}/status`, {
                        method: "PATCH",
                        headers: authHeaders(),
                        body: JSON.stringify({ status: newStatus }),
                      });
                      setMyTasks(prev =>
                        prev.map(t =>
                          t.id === task.id ? { ...t, completed: !t.completed } : t
                        )
                      );
                    }}
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 accent-yellow-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-tight truncate">{task.title}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {formatDate(task.dueDate)} ·{" "}
                      <span className={`font-semibold ${priorityColors[task.priority] ?? "text-gray-400"}`}>
                        {task.priority}
                      </span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}