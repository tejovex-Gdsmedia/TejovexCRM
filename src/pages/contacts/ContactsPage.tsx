import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, Download, X } from "lucide-react";

interface Company {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyId: string | null;
  company: Company | null;
}

const contactSchema = z.object({
  firstName:   z.string().min(1, "First name is required"),
  lastName:    z.string().min(1, "Last name is required"),
  email:       z.string().email("Invalid email"),
  phone:       z.string().min(10, "Enter valid phone number"),
  companyName: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const API = "https://tejovexcrm-backend.onrender.com/api/v1";
const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

export default function ContactsPage() {
  const [contacts, setContacts]               = useState<Contact[]>([]);
  const [search, setSearch]                   = useState("");
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [editingContact, setEditingContact]   = useState<Contact | null>(null);
  const [viewingContact, setViewingContact]   = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [importing, setImporting]             = useState(false);
  const [importResult, setImportResult]       = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const fileInputRef                          = useRef<HTMLInputElement>(null);
  const [loading, setLoading]                 = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  useEffect(() => {
    axios.get(`${API}/contacts`, getAuthHeaders())
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setContacts(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = contacts.filter((c) =>
    [c.firstName, c.lastName, c.email, c.phone, c.company?.name]
      .join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingContact(null);
    reset({ firstName: "", lastName: "", email: "", phone: "", companyName: "" });
    setIsModalOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    reset({
      firstName:   contact.firstName,
      lastName:    contact.lastName,
      email:       contact.email,
      phone:       contact.phone || "",
      companyName: contact.company?.name || "",
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ContactFormData) => {
    try {
      if (editingContact) {
        const res = await axios.put(`${API}/contacts/${editingContact.id}`, {
          firstName:   data.firstName,
          lastName:    data.lastName,
          email:       data.email,
          phone:       data.phone,
          companyName: data.companyName || undefined,
        }, getAuthHeaders());
        setContacts((prev) => prev.map((c) =>
          c.id === editingContact.id ? res.data.data : c
        ));
      } else {
        const res = await axios.post(`${API}/contacts`, {
          firstName:   data.firstName,
          lastName:    data.lastName,
          email:       data.email,
          phone:       data.phone,
          companyName: data.companyName || undefined,
        }, getAuthHeaders());
        setContacts((prev) => [...prev, res.data.data]);
      }
      setIsModalOpen(false);
      setEditingContact(null);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, "").toLowerCase());
    const firstNameIdx = headers.findIndex((h) => h === "firstname" || h === "first name");
    const lastNameIdx  = headers.findIndex((h) => h === "lastname"  || h === "last name");
    const emailIdx     = headers.findIndex((h) => h === "email");
    const phoneIdx     = headers.findIndex((h) => h === "phone");
    if (firstNameIdx === -1) return [];
    return lines.slice(1).filter((l) => l.trim()).map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
      return {
        firstName: cols[firstNameIdx] || "",
        lastName:  lastNameIdx >= 0 ? cols[lastNameIdx] || "" : "",
        email:     emailIdx  >= 0 ? cols[emailIdx]  || "" : "",
        phone:     phoneIdx  >= 0 ? cols[phoneIdx]  || "" : "",
      };
    }).filter((c) => c.firstName);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCSV(text);
    if (parsed.length === 0) {
      alert("No valid contacts found.\nCSV must have: FirstName, LastName, Email, Phone");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (parsed.length > 500) {
      alert("Maximum 500 contacts per import.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const res = await axios.post(`${API}/contacts/import`, { contacts: parsed }, getAuthHeaders());
      setImportResult(res.data?.data);
      const refreshed = await axios.get(`${API}/contacts`, getAuthHeaders());
      setContacts(Array.isArray(refreshed.data) ? refreshed.data : refreshed.data.data || []);
    } catch (err: any) {
      alert(err.response?.data?.message || "Import failed.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadSampleCSV = () => {
    const csv = ["FirstName,LastName,Email,Phone", "John,Doe,john@example.com,9876543210", "Jane,Smith,jane@example.com,8765432109"].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "contacts_sample.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!deletingContact) return;
    await axios.delete(`${API}/contacts/${deletingContact.id}`, getAuthHeaders());
    setContacts((prev) => prev.filter((c) => c.id !== deletingContact.id));
    setDeletingContact(null);
  };

  // ── Shared input class ──────────────────────────────────────────────────────
  const inputCls = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#111318] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-600";

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            People in your CRM linked to companies, leads and deals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1e2235] transition"
          >
            <Download size={14} /> Sample CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-800 dark:bg-[#1A1D27] dark:border dark:border-gray-600 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-[#1e2235] disabled:opacity-50 transition"
          >
            <Upload size={14} /> {importing ? "Importing…" : "Import CSV"}
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Add Contact
          </button>
        </div>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className="mb-4 flex items-center justify-between px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">
            ✓ Import complete — <b>{importResult.created}</b> created, <b>{importResult.skipped}</b> skipped
            {importResult.errors.length > 0 && (
              <span className="text-red-500 ml-1">, {importResult.errors.length} errors</span>
            )}
          </p>
          <button onClick={() => setImportResult(null)} className="ml-4 text-green-500 hover:text-green-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 w-full max-w-sm">
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputCls}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-[#2e3245]">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-[#1A1D27] text-gray-500 dark:text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2e3245]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">
                    No contacts found.
                  </td>
                </tr>
              ) : (
                filtered.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-gray-50 dark:hover:bg-[#1e2235] transition-colors bg-white dark:bg-[#111318]"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                      {contact.firstName} {contact.lastName}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{contact.email}</td>
                    <td className="px-6 py-4 text-brand-600 font-medium">{contact.phone}</td>
                    <td className="px-6 py-4 text-blue-600 dark:text-blue-400">{contact.company?.name || "—"}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => setViewingContact(contact)}
                        className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-[#1e2235] transition"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEdit(contact)}
                        className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-[#1e2235] transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingContact(contact)}
                        className="px-3 py-1 text-xs border border-red-300 dark:border-red-800 text-red-500 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {viewingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-[#2e3245] rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Contact Details</h2>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p><span className="font-medium text-gray-900 dark:text-white">Name:</span> {viewingContact.firstName} {viewingContact.lastName}</p>
              <p><span className="font-medium text-gray-900 dark:text-white">Email:</span> {viewingContact.email}</p>
              <p><span className="font-medium text-gray-900 dark:text-white">Phone:</span> {viewingContact.phone}</p>
              <p><span className="font-medium text-gray-900 dark:text-white">Company:</span> {viewingContact.company?.name || "—"}</p>
            </div>
            <button
              onClick={() => setViewingContact(null)}
              className="mt-5 w-full py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1e2235] transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-[#2e3245] rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editingContact ? "Edit Contact" : "Add Contact"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">First Name</label>
                <input {...register("firstName")} placeholder="First name" className={inputCls} />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Last Name</label>
                <input {...register("lastName")} placeholder="Last name" className={inputCls} />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Email</label>
                <input {...register("email")} placeholder="email@example.com" className={inputCls} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Phone</label>
                <input {...register("phone")} placeholder="9XXXXXXXXX" className={inputCls} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Company Name</label>
                <input {...register("companyName")} placeholder="Type company name" className={inputCls} />
                {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1e2235] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition"
                >
                  {editingContact ? "Save Changes" : "Add Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-[#2e3245] rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Delete Contact</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Are you sure you want to delete{" "}
              <strong className="text-gray-900 dark:text-white">
                {deletingContact.firstName} {deletingContact.lastName}
              </strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingContact(null)}
                className="flex-1 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1e2235] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}