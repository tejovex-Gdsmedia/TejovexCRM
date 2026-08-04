import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";

const BASE_URL = "https://tejovexcrm-backend.onrender.com/api/v1";

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYjYwMzdiNC0zZjYzLTRjYzgtODI5NS1jMTYzYmQ5N2RjYjYiLCJlbWFpbCI6InRlY2hnZHNtZWRpYUBnbWFpbC5jb20iLCJyb2xlSWQiOiJhNGI0NDIzYy1iYWZlLTRiYjEtYmIzOC02NTlhYzk1YTA5ODEiLCJpYXQiOjE3ODU0MTQyODgsImV4cCI6MTc4NjAxOTA4OH0.eMs-9-pYlukIqTaWnrKdJDm5qrru897X4GJNPB1LtDU";

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${TOKEN}`,
  },
});

// ── Types ────────────────────────────────────────────────────
type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  assignedToName?: string;
  assignedTo?: { firstName: string; lastName: string } | null;
  lead?: { id: string; title: string } | null;
  deal?: { id: string; title: string } | null;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface LinkedLead {
  id: string;
  title: string;
}

interface LinkedDeal {
  id: string;
  title: string;
}

// ── Schema ───────────────────────────────────────────────────
const taskSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  dueDate: z.string().optional(),
  assignedToName: z.string().optional(),
  linkedTo: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

// ── Style Maps ───────────────────────────────────────────────
const priorityStyles: Record<TaskPriority, string> = {
  HIGH: "text-red-500 font-semibold",
  MEDIUM: "text-orange-500 font-semibold",
  LOW: "text-green-500 font-semibold",
};

const statusStyles: Record<TaskStatus, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

// ── Main Component ───────────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusModal, setStatusModal] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<LinkedLead[]>([]);
const [deals, setDeals] = useState<LinkedDeal[]>([]);
const [linkType, setLinkType] = useState<"" | "lead" | "deal">("");
const [linkedId, setLinkedId] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  // ── Fetch from backend ───────────────────────────────────
  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/tasks`, getAuthHeaders());
      setTasks(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);
  useEffect(() => {
  axios.get(`${BASE_URL}/users`, getAuthHeaders())
    .then((res) => {
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setUsers(data);
    })
    .catch((err) => console.error("Fetch users error:", err));
}, []);
useEffect(() => {
  axios.get(`${BASE_URL}/leads`, getAuthHeaders())
    .then((res) => setLeads(res.data.data || []))
    .catch((err) => console.error("Fetch leads error:", err));

  axios.get(`${BASE_URL}/deals`, getAuthHeaders())
    .then((res) => setDeals(res.data.data || []))
    .catch((err) => console.error("Fetch deals error:", err));
}, []);

  // ── Display helpers ──────────────────────────────────────
  const getAssigneeName = (task: Task) => {
    if (task.assignedToName) return task.assignedToName;
    if (task.assignedTo) return `${task.assignedTo.firstName} ${task.assignedTo.lastName}`;
    return "—";
  };

  const getLinkedTo = (task: Task) => {
    if (task.lead?.title) return `Lead: ${task.lead.title}`;
    if (task.deal?.title) return `Deal: ${task.deal.title}`;
    return "—";
  };

  // ── Filter ───────────────────────────────────────────────
  const filtered = tasks.filter((t) => {
    const assignee = getAssigneeName(t);
    const linked = getLinkedTo(t);
    const matchesSearch = [t.title, t.priority, t.status, assignee, linked]
      .join(" ").toLowerCase().includes(search.toLowerCase());
    const matchesMyTasks = showMyTasks
      ? assignee.toLowerCase().includes("sujal")
      : true;
    return matchesSearch && matchesMyTasks;
  });

  // ── Open Add ─────────────────────────────────────────────
  const openAdd = () => {
    setEditingTask(null);
    reset({
      title: "", description: "", priority: "MEDIUM",
      status: "PENDING", dueDate: "", assignedToName: "", linkedTo: "",
    });
    setLinkType(""); 
    setLinkedId(""); 
    setIsModalOpen(true);
  };

  // ── Open Edit ────────────────────────────────────────────
  const openEdit = (task: Task) => {
    setEditingTask(task);
    const assignee = getAssigneeName(task);
    reset({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      assignedToName: assignee === "—" ? "" : assignee,
      linkedTo: "",
    });
    setLinkType(task.lead ? "lead" : task.deal ? "deal" : ""); 
    setLinkedId(task.lead?.id || task.deal?.id || "");        
    setIsModalOpen(true);
  };

  // ── Create / Update ──────────────────────────────────────
  const onSubmit = async (data: TaskFormData) => {
    const payload = {
      title: data.title,
      description: data.description || undefined,
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate || undefined,
      assignedToName: data.assignedToName || undefined,
        leadId: linkType === "lead" && linkedId ? linkedId : undefined,   
        dealId: linkType === "deal" && linkedId ? linkedId : undefined,   

    };
    try {
      if (editingTask) {
        const res = await axios.put(
          `${BASE_URL}/tasks/${editingTask.id}`,
          payload,
          getAuthHeaders()
        );
        setTasks((prev) =>
          prev.map((t) => t.id === editingTask.id ? res.data.data : t)
        );
      } else {
        const res = await axios.post(`${BASE_URL}/tasks`, payload, getAuthHeaders());
        setTasks((prev) => [res.data.data, ...prev]);
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save task. Check console for details.");
    }
  };

  // ── Delete ───────────────────────────────────────────────
const handleDelete = async () => {
    if (!deletingTask) return;
    try {
      await axios.delete(`${BASE_URL}/tasks/${deletingTask.id}`, getAuthHeaders());
      setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
      setDeletingTask(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // ── Status Change ────────────────────────────────────────
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!statusModal) return;
    try {
      await axios.patch(
        `${BASE_URL}/tasks/${statusModal.id}/status`,
        { status: newStatus },
        getAuthHeaders()
      );
      setTasks((prev) =>
        prev.map((t) => t.id === statusModal.id ? { ...t, status: newStatus } : t)
      );
      setStatusModal(null);
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">
            All tasks across the team. Use "My Tasks" to filter by logged-in user.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMyTasks(!showMyTasks)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
              showMyTasks
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            My Tasks
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 mt-4 w-full max-w-sm">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-400 text-sm mt-6">Loading tasks...</p>
      ) : (
        <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Assigned To</th>
                <th className="px-6 py-3">Linked To</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No tasks found.
                  </td>
                </tr>
              ) : (
                filtered.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{task.title}</td>
                    <td className={`px-6 py-4 ${priorityStyles[task.priority]}`}>{task.priority}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[task.status]}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(task.dueDate)}</td>
                    <td className="px-6 py-4 text-gray-600">{getAssigneeName(task)}</td>
                    <td className="px-6 py-4 text-gray-600">{getLinkedTo(task)}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => setStatusModal(task)}
                        className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition"
                      >
                        Status
                      </button>
                      <button
                        onClick={() => openEdit(task)}
                        className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingTask(task)}
                        className="px-3 py-1 text-xs border border-red-300 text-red-500 rounded hover:bg-red-50 transition"
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Status Modal — kept exactly as original */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xs p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Status</h2>
            <div className="space-y-2">
              {(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as TaskStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${statusStyles[s]} hover:opacity-80 transition`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStatusModal(null)}
              className="mt-4 w-full py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingTask ? "Edit Task" : "New Task"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Title</label>
                <input
                  {...register("title")}
                  placeholder="Task title"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Description</label>
                <textarea
                  {...register("description")}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Priority</label>
                <select
                  {...register("priority")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Status</label>
                <select
                  {...register("status")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Due Date</label>
                <input
                  {...register("dueDate")}
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Assigned To</label>
<select
  {...register("assignedToName")}
  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
>
  <option value="">Select a user...</option>
  {users.map((u) => (
    <option key={u.id} value={`${u.firstName} ${u.lastName}`}>
      {u.firstName} {u.lastName}
    </option>
  ))}
</select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Link To</label>
                <select
                  value={linkType}
                  onChange={(e) => { setLinkType(e.target.value as "" | "lead" | "deal"); setLinkedId(""); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-2"
                >
                  <option value="">None</option>
                  <option value="lead">Lead</option>
                  <option value="deal">Deal</option>
                </select>

                {linkType === "lead" && (
                  <select
                    value={linkedId}
                    onChange={(e) => setLinkedId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">Select a lead...</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                )}

                {linkType === "deal" && (
                  <select
                    value={linkedId}
                    onChange={(e) => setLinkedId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">Select a deal...</option>
                    {deals.map((d) => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  {editingTask ? "Save Changes" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

{/* Delete Modal */}
      {deletingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete Task</h2>
            <p className="text-sm text-gray-600 mb-5">Are you sure you want to delete <strong>{deletingTask.title}</strong>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingTask(null)} className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}