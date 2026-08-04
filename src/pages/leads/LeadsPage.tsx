import { useState, useEffect } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";


const API = "https://tejovexcrm-backend.onrender.com/api/v1";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYjYwMzdiNC0zZjYzLTRjYzgtODI5NS1jMTYzYmQ5N2RjYjYiLCJlbWFpbCI6InRlY2hnZHNtZWRpYUBnbWFpbC5jb20iLCJyb2xlSWQiOiJhNGI0NDIzYy1iYWZlLTRiYjEtYmIzOC02NTlhYzk1YTA5ODEiLCJpYXQiOjE3ODU0MTQyODgsImV4cCI6MTc4NjAxOTA4OH0.eMs-9-pYlukIqTaWnrKdJDm5qrru897X4GJNPB1LtDU";
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${TOKEN}` },
});
const displayName = (val: any): string => {
  if (!val) return "—";
  if (typeof val === "string") return val || "—";
  return `${val.firstName ?? ""} ${val.lastName ?? ""}`.trim() || "—";
};

//  Types 
type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "UNQUALIFIED";
type LeadSource = "WEBSITE" | "REFERRAL" | "INDIAMART" | "WHATSAPP" | "EMAIL" | "COLD_CALL" | "OTHER";

interface Lead {
  id: string;
  title: string;
  status: LeadStatus;
  source?: LeadSource;
  value?: number;
  contactName?: string;
  assignedToName?: string;
  assignedTo?: { firstName: string; lastName: string } | null;
  contact?: { firstName: string; lastName: string } | null;
  createdAt?: string;
}

// ADD this type after the Lead interface
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

//  Schema 
const leadSchema = z.object({
  title: z.string().min(2, "Title is required"),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "UNQUALIFIED"]),
  source: z.enum(["WEBSITE", "REFERRAL", "INDIAMART", "WHATSAPP", "EMAIL", "COLD_CALL", "OTHER"]),
  value: z.coerce.number().min(0, "Value must be positive"),
  contactName: z.string().optional(),
  assignedToName: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

//  Sample Data 
const sampleLeads: Lead[] = [
];

//  Status badge colors 
const statusStyles: Record<LeadStatus, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-purple-100 text-purple-700",
  QUALIFIED: "bg-orange-100 text-orange-700",
  CONVERTED: "bg-green-100 text-green-700",
  UNQUALIFIED: "bg-red-100 text-red-700",
};

//  Source badge colors 
const sourceStyles: Record<LeadSource, string> = {
  WEBSITE: "bg-gray-100 text-gray-600",
  REFERRAL: "bg-gray-100 text-gray-600",
  INDIAMART: "bg-gray-100 text-gray-600",
  WHATSAPP: "bg-gray-100 text-gray-600",
  EMAIL: "bg-gray-100 text-gray-600",
  COLD_CALL: "bg-gray-100 text-gray-600",
  OTHER: "bg-gray-100 text-gray-600",
};

//  Main Component 
export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [statusModal, setStatusModal] = useState<Lead | null>(null);
  const [assignModal, setAssignModal] = useState<Lead | null>(null);
  const [assignName, setAssignName] = useState("");
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [users, setUsers] = useState<User[]>([]);

const fetchLeads = () => {
    axios.get(`${API}/leads`, getAuthHeaders())
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setLeads(data);
      })
      .catch((err) => console.error("Fetch leads error:", err));
  };

  useEffect(() => {
    fetchLeads();
  }, []);
  useEffect(() => {
  axios.get(`${API}/users`, getAuthHeaders())
    .then((res) => {
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setUsers(data);
    })
    .catch((err) => console.error("Fetch users error:", err));
}, []);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
  });

  const filtered = leads.filter((l) =>
    [l.title, l.status, l.source, l.assignedTo, l.contact].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingLead(null);
       reset({ title: "", status: "NEW", source: "WEBSITE", value: 0, contactName: "", assignedToName: "" });    setIsModalOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    reset({
      title: lead.title,
      status: lead.status,
      source: lead.source || "",
      value: lead.value ?? 0,
      contactName: lead.contactName || "",
      assignedToName: lead.assignedToName || "",
    });
    setIsModalOpen(true);
  };

 const onSubmit = async (data: LeadFormData) => {
      const payload = {
      title: data.title,
      status: data.status,
      source: data.source,
      value: data.value,
      contactName: data.contactName || undefined,
      assignedToName: data.assignedToName || undefined,
    };
    try {
      if (editingLead) {
        await axios.put(`${API}/leads/${editingLead.id}`, payload, getAuthHeaders());
      } else {
        await axios.post(`${API}/leads`, payload, getAuthHeaders());
      }
      setIsModalOpen(false);
      setEditingLead(null);
      fetchLeads();
    } catch (err: any) {
      console.error("Submit error:", err);
      alert(err?.response?.data?.message || "Something went wrong. Check console.");
    }
  };

const handleDelete = async () => {
    if (!deletingLead) return;
    try {
      await axios.delete(`${API}/leads/${deletingLead.id}`, getAuthHeaders());
      setDeletingLead(null);
      fetchLeads();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!statusModal) return;
    try {
      await axios.put(`${API}/leads/${statusModal.id}`, { status: newStatus }, getAuthHeaders());
      setStatusModal(null);
      fetchLeads();
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

const handleAssign = async () => {
  if (!assignModal || !assignName.trim()) return;
  try {
    await axios.patch(
      `${API}/leads/${assignModal.id}/assign`,
      { assignedToName: assignName.trim(), assignedToId: users.find(u => `${u.firstName} ${u.lastName}` === assignName)?.id },
      getAuthHeaders()
    );
    setLeads(prev =>
      prev.map(l =>
        l.id === assignModal.id ? { ...l, assignedToName: assignName.trim() } : l
      )
    );
    setAssignModal(null);
    setAssignName('');
  } catch (err) {
    console.error('Assign failed:', err);
    alert('Failed to assign lead. Please try again.');
  }
};

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">Track potential customers from first touch to conversion.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          + New Lead
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 w-full max-w-sm">
        <input
          type="text"
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Source</th>
              <th className="px-6 py-3">Value</th>
              <th className="px-6 py-3">Assigned To</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">No leads found.</td>
              </tr>
            ) : (
              filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{lead.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[lead.status]}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${sourceStyles[lead.source]}`}>
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {lead.value > 0 ? `₹${lead.value.toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{lead.assignedToName || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{lead.contactName || displayName(lead.contact)}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => setViewingLead(lead)} className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition">View</button>
                    <button onClick={() => setStatusModal(lead)} className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition">Status</button>
                    <button onClick={() => { setAssignModal(lead); setAssignName(lead.assignedToName || ''); }} className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition">Assign</button>
                    <button onClick={() => setDeletingLead(lead)} className="px-3 py-1 text-xs border border-red-300 text-red-500 rounded hover:bg-red-50 transition">Del</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {viewingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Lead Details</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">Title:</span> {viewingLead.title}</p>
              <p><span className="font-medium">Status:</span> <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[viewingLead.status]}`}>{viewingLead.status}</span></p>
              <p><span className="font-medium">Source:</span> {viewingLead.source}</p>
              <p><span className="font-medium">Value:</span> {viewingLead.value > 0 ? `₹${viewingLead.value.toLocaleString("en-IN")}` : "—"}</p>
              <p><span className="font-medium">Assigned To:</span> {viewingLead.assignedToName || displayName(viewingLead.assignedTo)}</p>
              <p><span className="font-medium">Contact:</span> {viewingLead.contactName || displayName(viewingLead.contact)}</p>
            </div>
            <button onClick={() => setViewingLead(null)} className="mt-5 w-full py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">Close</button>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xs p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Status</h2>
            <div className="space-y-2">
              {(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "UNQUALIFIED"] as LeadStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${statusStyles[s]} hover:opacity-80 transition`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button onClick={() => setStatusModal(null)} className="mt-4 w-full py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
          </div>
        </div>
      )}

{/* Assign Modal */}
{assignModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-xs p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Assign Lead</h2>
<select
  value={assignName}
  onChange={(e) => setAssignName(e.target.value)}
  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
>
  <option value="">Select a user...</option>
  {users.map((u) => (
    <option key={u.id} value={`${u.firstName} ${u.lastName}`}>
      {u.firstName} {u.lastName}
    </option>
  ))}
</select>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => { setAssignModal(null); setAssignName(''); }}
          className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleAssign}
          className="flex-1 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
        >
          Assign
        </button>
      </div>
    </div>
  </div>
)}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-800">{editingLead ? "Edit Lead" : "New Lead"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Title</label>
                <input {...register("title")} placeholder="Lead title" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Status</label>
                <select {...register("status")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="NEW">NEW</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="CONVERTED">CONVERTED</option>
                  <option value="UNQUALIFIED">UNQUALIFIED</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Source</label>
                <select {...register("source")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="WEBSITE">WEBSITE</option>
                  <option value="REFERRAL">REFERRAL</option>
                  <option value="INDIAMART">INDIAMART</option>
                  <option value="WHATSAPP">WHATSAPP</option>
                  <option value="EMAIL">EMAIL</option>
                  <option value="COLD_CALL">COLD_CALL</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Value (₹)</label>
                <input {...register("value")} type="number" placeholder="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>}
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
                <label className="text-sm text-gray-600 mb-1 block">Contact</label>
                <input {...register("contactName")} placeholder="Contact name" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">{editingLead ? "Save Changes" : "Add Lead"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

{/* Delete Modal */}
      {deletingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete Lead</h2>
            <p className="text-sm text-gray-600 mb-5">Are you sure you want to delete <strong>{deletingLead.title}</strong>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingLead(null)} className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}