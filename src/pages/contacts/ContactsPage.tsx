import { useState, useEffect } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ── Types ──────────────────────────────────────────
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

// ── Schema ─────────────────────────────────────────
const contactSchema = z.object({
  firstName:   z.string().min(1, "First name is required"),
  lastName:    z.string().min(1, "Last name is required"),
  email:       z.string().email("Invalid email"),
  phone:       z.string().min(10, "Enter valid phone number"),
  companyName: z.string().optional(),   // ← CHANGED: was companyId
});

type ContactFormData = z.infer<typeof contactSchema>;

// ── API Config ─────────────────────────────────────
const API   = "https://tejovexcrm-backend.onrender.com/api/v1";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYjYwMzdiNC0zZjYzLTRjYzgtODI5NS1jMTYzYmQ5N2RjYjYiLCJlbWFpbCI6InRlY2hnZHNtZWRpYUBnbWFpbC5jb20iLCJyb2xlSWQiOiJhNGI0NDIzYy1iYWZlLTRiYjEtYmIzOC02NTlhYzk1YTA5ODEiLCJpYXQiOjE3ODUzMjM2OTgsImV4cCI6MTc4NTkyODQ5OH0.PreWV_1JvkMl1BpaQRXSlVfeG_NSOx03P2ulx3NoOaA";
const authHeaders = { headers: { Authorization: `Bearer ${TOKEN}` } };

// ── Main Component ─────────────────────────────────
export default function ContactsPage() {
  const [contacts, setContacts]             = useState<Contact[]>([]);
  // ↑ REMOVED: const [companies, setCompanies] — no longer needed
  const [search, setSearch]                 = useState("");
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  // Fetch contacts only — REMOVED companies fetch
  useEffect(() => {
    axios.get(`${API}/contacts`, authHeaders)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setContacts(data);
      })
      .catch((err) => console.error(err));

    // ↑ REMOVED: companies axios.get — dropdown gone, no need to load list
  }, []);

  const filtered = contacts.filter((c) =>
    [c.firstName, c.lastName, c.email, c.phone, c.company?.name]
      .join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingContact(null);
    reset({ firstName: "", lastName: "", email: "", phone: "", companyName: "" }); // ← CHANGED: companyId → companyName
    setIsModalOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    reset({
      firstName:   contact.firstName,
      lastName:    contact.lastName,
      email:       contact.email,
      phone:       contact.phone || "",
      companyName: contact.company?.name || "",  // ← CHANGED: was companyId
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
          companyName: data.companyName || undefined,  // ← CHANGED: was companyId
        }, authHeaders);

        // Update local state with the company the backend linked
        setContacts((prev) => prev.map((c) =>
          c.id === editingContact.id ? res.data.data : c
        ));
      } else {
        const res = await axios.post(`${API}/contacts`, {
          firstName:   data.firstName,
          lastName:    data.lastName,
          email:       data.email,
          phone:       data.phone,
          companyName: data.companyName || undefined,  // ← CHANGED: was companyId
        }, authHeaders);

        setContacts((prev) => [...prev, res.data.data]);
      }
      setIsModalOpen(false);
      setEditingContact(null);
    } catch (err) {
      console.error("Error:", err);
    }
  };

const handleDelete = async () => {
    if (!deletingContact) return;
    await axios.delete(`${API}/contacts/${deletingContact.id}`, authHeaders);
    setContacts((prev) => prev.filter((c) => c.id !== deletingContact.id));
    setDeletingContact(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header — UNCHANGED */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">People in your CRM linked to companies, leads and deals.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          + Add Contact
        </button>
      </div>

      {/* Search — UNCHANGED */}
      <div className="mb-4 w-full max-w-sm">
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* Table — UNCHANGED */}
      <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Company</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No contacts found.</td>
              </tr>
            ) : (
              filtered.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{contact.firstName} {contact.lastName}</td>
                  <td className="px-6 py-4 text-gray-600">{contact.email}</td>
                  <td className="px-6 py-4 text-orange-500 font-medium">{contact.phone}</td>
                  <td className="px-6 py-4 text-blue-600">{contact.company?.name || "—"}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => setViewingContact(contact)} className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition">View</button>
                    <button onClick={() => openEdit(contact)} className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition">Edit</button>
                    <button onClick={() => setDeletingContact(contact)} className="px-3 py-1 text-xs border border-red-300 text-red-500 rounded hover:bg-red-50 transition">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal — UNCHANGED */}
      {viewingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Details</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">Name:</span> {viewingContact.firstName} {viewingContact.lastName}</p>
              <p><span className="font-medium">Email:</span> {viewingContact.email}</p>
              <p><span className="font-medium">Phone:</span> {viewingContact.phone}</p>
              <p><span className="font-medium">Company:</span> {viewingContact.company?.name || "—"}</p>
            </div>
            <button onClick={() => setViewingContact(null)} className="mt-5 w-full py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">Close</button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-800">{editingContact ? "Edit Contact" : "Add Contact"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* First / Last name — UNCHANGED */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">First Name</label>
                <input {...register("firstName")} placeholder="First name" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Last Name</label>
                <input {...register("lastName")} placeholder="Last name" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Email</label>
                <input {...register("email")} placeholder="email@example.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Phone</label>
                <input {...register("phone")} placeholder="9XXXXXXXXX" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>

              {/* Company — CHANGED: select → input text */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Company Name</label>
                <input
                  {...register("companyName")}
                  placeholder="Type company name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">{editingContact ? "Save Changes" : "Add Contact"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

{/* Delete Modal */}
      {deletingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete Contact</h2>
            <p className="text-sm text-gray-600 mb-5">Are you sure you want to delete <strong>{deletingContact.firstName} {deletingContact.lastName}</strong>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingContact(null)} className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}