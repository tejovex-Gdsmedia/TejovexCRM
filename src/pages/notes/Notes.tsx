import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { getNotes, createNote, updateNote, deleteNote } from "../../api/notes.api";
import type { Note, NotePayload } from "../../api/notes.api";
import { getLeads } from "../../api/leads.api";
import { getContacts } from "../../api/contacts.api";

const inputCls = "w-full rounded-lg bg-gray-100 dark:bg-[#111318] px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none ring-1 ring-gray-200 dark:ring-[#2e3245] focus:ring-brand-600 transition-all";
const labelCls = "text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400";
const modalCls = "w-full rounded-xl bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-[#2e3245] p-6 shadow-xl";

const linkColors: Record<string, string> = {
  lead:    "text-brand-600",
  contact: "text-green-600 dark:text-green-400",
};

function NoteModal({
  initial, onClose, onSave,
}: {
  initial?: Note | null;
  onClose: () => void;
  onSave: (data: NotePayload) => Promise<void>;
}) {
  const [content,    setContent]    = useState(initial?.content ?? "");
  const [linkedType, setLinkedType] = useState(
    initial?.leadId ? "lead" : initial?.contactId ? "contact" : "none"
  );
  const [linkedId,   setLinkedId]   = useState(initial?.leadId ?? initial?.contactId ?? "");
  const [leads,      setLeads]      = useState<any[]>([]);
  const [contacts,   setContacts]   = useState<any[]>([]);
  const [error,      setError]      = useState("");
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    getLeads()
      .then(res => { const data = res.data?.data ?? res.data; setLeads(Array.isArray(data) ? data : []); })
      .catch(() => {});
    getContacts()
      .then(res => { const data = res.data?.data ?? res.data; setContacts(Array.isArray(data) ? data : []); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) { setError("Note content is required"); return; }
    try {
      setSaving(true);
      const payload: NotePayload = {
        content,
        ...(linkedType === "lead"    && linkedId ? { leadId:    linkedId } : {}),
        ...(linkedType === "contact" && linkedId ? { contactId: linkedId } : {}),
      };
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`${modalCls} max-w-md`}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {initial ? "Edit Note" : "Add Note"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Note Content *</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your note here..."
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Link To</label>
            <select
              value={linkedType}
              onChange={e => { setLinkedType(e.target.value); setLinkedId(""); }}
              className={inputCls}
            >
              <option value="none">None</option>
              <option value="lead">Lead</option>
              <option value="contact">Contact</option>
            </select>
          </div>

          {linkedType === "lead" && (
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Select Lead</label>
              <select value={linkedId} onChange={e => setLinkedId(e.target.value)} className={inputCls}>
                <option value="">Select a lead...</option>
                {leads.length === 0 ? (
                  <option disabled>No leads found</option>
                ) : (
                  leads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.title ?? lead.name ?? lead.companyName ?? lead.id}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {linkedType === "contact" && (
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Select Contact</label>
              <select value={linkedId} onChange={e => setLinkedId(e.target.value)} className={inputCls}>
                <option value="">Select a contact...</option>
                {contacts.length === 0 ? (
                  <option disabled>No contacts found</option>
                ) : (
                  contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mt-1 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 dark:border-[#2e3245] py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2235] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-brand-600 hover:bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving…" : initial ? "Save Changes" : "Add Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`${modalCls} max-w-sm`}>
        <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">Delete Note</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Are you sure? This cannot be undone.</p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 dark:border-[#2e3245] py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2235] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-500 hover:bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Notes() {
  const [notes,      setNotes]      = useState<Note[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [showAdd,    setShowAdd]    = useState(false);
  const [editItem,   setEditItem]   = useState<Note | null>(null);
  const [deleteItem, setDeleteItem] = useState<Note | null>(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await getNotes();
      const data = res.data?.data ?? res.data;
      setNotes(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotes(); }, []);

  const handleAdd    = async (payload: NotePayload) => { await createNote(payload); await fetchNotes(); };
  const handleEdit   = async (payload: NotePayload) => { if (!editItem) return; await updateNote(editItem.id, payload); await fetchNotes(); };
  const handleDelete = async () => { if (!deleteItem) return; await deleteNote(deleteItem.id); setDeleteItem(null); await fetchNotes(); };

  const getInitials = (note: Note) => {
    if (note.createdBy) return (note.createdBy.firstName?.[0] ?? "") + (note.createdBy.lastName?.[0] ?? "");
    return "??";
  };

  const getName = (note: Note) => {
    if (note.createdBy) return `${note.createdBy.firstName} ${note.createdBy.lastName}`;
    return "Unknown";
  };

  const getLinkedLabel = (note: Note) => {
    if (note.leadId) {
      const name = note.lead?.title ?? note.lead?.name ?? note.lead?.companyName ?? "Lead";
      return { type: "lead", label: `Lead — ${name}` };
    }
    if (note.contactId) {
      const name = note.contact ? `${note.contact.firstName} ${note.contact.lastName}` : "Contact";
      return { type: "contact", label: `Contact — ${name}` };
    }
    return null;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="p-6">
      {showAdd    && <NoteModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {editItem   && <NoteModal initial={editItem} onClose={() => setEditItem(null)} onSave={handleEdit} />}
      {deleteItem && <DeleteModal onClose={() => setDeleteItem(null)} onConfirm={handleDelete} />}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Notes</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Notes are embedded inside Contact, Lead, and Deal detail pages.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          <Plus size={15} />
          Add Note
        </button>
      </div>

      {/* States */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-gray-200 dark:border-[#2e3245] bg-white dark:bg-[#1A1D27] py-16 text-center text-sm text-red-500 dark:text-red-400 shadow-sm">
          {error}
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-[#2e3245] bg-white dark:bg-[#1A1D27] py-16 text-center text-sm text-gray-400 dark:text-gray-500 shadow-sm">
          No notes yet — click "+ Add Note" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {notes.map(note => {
            const linked = getLinkedLabel(note);
            return (
              <div
                key={note.id}
                className="flex flex-col justify-between rounded-xl border border-gray-200 dark:border-[#2e3245] bg-white dark:bg-[#1A1D27] p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Author row */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white uppercase">
                        {getInitials(note)}
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {getName(note)}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      {formatDate(note.createdAt)}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {note.content}
                  </p>

                  {/* Linked label */}
                  {linked && (
                    <p className="mt-3 text-[12px] text-gray-400 dark:text-gray-500">
                      Linked to:{" "}
                      <span className={`font-semibold ${linkColors[linked.type]}`}>
                        {linked.label}
                      </span>
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => setEditItem(note)}
                    className="rounded-lg border border-gray-200 dark:border-[#2e3245] px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2235] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteItem(note)}
                    className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}