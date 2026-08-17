import { useState, useEffect, useRef } from "react";
import { Eye, Pencil, Trash2, Plus, X, Upload, Download } from "lucide-react";
import {
  getCompanies, createCompany, updateCompany, deleteCompany,
} from "../../api/companies.api";
import type { Company, CompanyPayload } from "../../api/companies.api";
import axios from "axios";

const API = "https://tejovexcrm-backend.onrender.com/api/v1";
const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } });

const inputCls = "w-full rounded-lg bg-gray-100 px-3 py-2.5 text-sm outline-none ring-1 ring-gray-200 focus:ring-yellow-500 placeholder:text-gray-400 transition-all";
const labelCls = "text-[11px] font-semibold uppercase tracking-wider text-gray-500";

// ── CSV Parser ──
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = false;
      } else current += char;
    } else {
      if (char === '"') inQuotes = true;
      else if (char === ",") { result.push(current.trim()); current = ""; }
      else current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSVFile(text: string) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [] as string[], rows: [] as string[][] };
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
  const rows = lines.slice(1).filter((l) => l.trim()).map(parseCSVLine);
  return { headers, rows };
}

const CSV_COLUMNS = ["Company Name", "Website", "Industry", "Contacts", "Deals"];

const findColumnIndex = (headers: string[], ...aliases: string[]) =>
  headers.findIndex((h) => aliases.includes(h));

// ── Add / Edit Modal ─────────────────────────────────────────
function CompanyModal({
  initial, onClose, onSave,
}: {
  initial?: Company | null;
  onClose: () => void;
  onSave: (data: CompanyPayload) => Promise<void>;
}) {
  const [name,     setName]     = useState(initial?.name     ?? "");
  const [website,  setWebsite]  = useState(initial?.website  ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [error,    setError]    = useState("");
  const [saving,   setSaving]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Company name is required"); return; }
    try {
      setSaving(true);
      await onSave({ name, website, industry });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {initial ? "Edit Company" : "Add Company"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Company Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sharma Traders" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Website</label>
            <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="e.g. sharmatraders.com" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Industry</label>
            <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Retail" className={inputCls} />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="mt-1 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-yellow-600 py-2.5 text-sm font-semibold text-white hover:bg-yellow-700 disabled:opacity-60 transition-colors">
              {saving ? "Saving..." : initial ? "Save Changes" : "Add Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── View Modal ───────────────────────────────────────────────
function ViewModal({ company, onClose }: { company: Company; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Company Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { label: "Company Name", value: company.name },
            { label: "Website",      value: company.website  || "—" },
            { label: "Industry",     value: company.industry || "—" },
            { label: "Contacts",     value: company._count?.contacts ?? 0 },
            { label: "Deals",        value: company._count?.deals    ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1 border-b border-gray-100 pb-3 last:border-0">
              <p className={labelCls}>{label}</p>
              <p className="text-sm font-medium text-gray-800">{value}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-5 w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}

// ── Delete Modal ─────────────────────────────────────────────
function DeleteModal({ company, onClose, onConfirm }: { company: Company; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">Delete Company</h2>
        <p className="text-sm text-gray-500">
          Are you sure you want to delete <span className="font-semibold text-gray-800">{company.name}</span>? This cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function Companies() {
  const [companies,  setCompanies]  = useState<Company[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [showAdd,    setShowAdd]    = useState(false);
  const [editItem,   setEditItem]   = useState<Company | null>(null);
  const [viewItem,   setViewItem]   = useState<Company | null>(null);
  const [deleteItem, setDeleteItem] = useState<Company | null>(null);
  const [importing,  setImporting]  = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await getCompanies();
      const data = res.data?.data ?? res.data;
      setCompanies(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleAdd    = async (data: CompanyPayload) => { await createCompany(data); await fetchCompanies(); };
  const handleEdit   = async (data: CompanyPayload) => { if (!editItem) return; await updateCompany(editItem.id, data); await fetchCompanies(); };
  const handleDelete = async () => { if (!deleteItem) return; await deleteCompany(deleteItem.id); setDeleteItem(null); await fetchCompanies(); };

  // ── Import CSV ──
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      alert("Please upload a .csv file");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const text = await file.text();
    const { headers, rows } = parseCSVFile(text);

    const nameIdx     = findColumnIndex(headers, "company name", "name", "company", "companyname");
    const websiteIdx  = findColumnIndex(headers, "website", "web");
    const industryIdx = findColumnIndex(headers, "industry");
    const contactsIdx = findColumnIndex(headers, "contacts");
    const dealsIdx    = findColumnIndex(headers, "deals");

    if (nameIdx === -1) {
      alert(`No valid "Company Name" column found.\n\nYour CSV must have these columns:\n${CSV_COLUMNS.join(", ")}`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const parsed = rows
      .map((row) => ({
        name:     row[nameIdx] || "",
        website:  websiteIdx  >= 0 ? row[websiteIdx]  || "" : "",
        industry: industryIdx >= 0 ? row[industryIdx] || "" : "",
      }))
      .filter((c) => c.name);

    if (parsed.length === 0) {
      alert("No valid companies found in CSV.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (parsed.length > 500) {
      alert("Maximum 500 companies per import.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImporting(true);
    setImportResult(null);
    try {
      const res = await axios.post(`${API}/companies/import`, { companies: parsed }, getAuthHeaders());
      setImportResult(res.data?.data);
      await fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.message || "Import failed.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Download Sample CSV ──
  const downloadSampleCSV = () => {
    const header = CSV_COLUMNS.join(",");
    const csv = header + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "companies-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">

      {/* Modals */}
      {showAdd    && <CompanyModal onClose={() => setShowAdd(false)}   onSave={handleAdd} />}
      {editItem   && <CompanyModal initial={editItem} onClose={() => setEditItem(null)}   onSave={handleEdit} />}
      {viewItem   && <ViewModal   company={viewItem}  onClose={() => setViewItem(null)} />}
      {deleteItem && <DeleteModal company={deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} />}

      {/* Heading */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Companies</h1>
          <p className="mt-1 text-sm text-gray-500">
            Organisations linked to your contacts and deals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download size={14} /> Sample CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <Upload size={14} /> {importing ? "Importing..." : "Import CSV"}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-yellow-700 transition-colors"
          >
            <Plus size={15} />
            Add Company
          </button>
        </div>
      </div>

      {/* Import Result Banner */}
      {importResult && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">
            ✓ Import complete — <b>{importResult.created}</b> created, <b>{importResult.skipped}</b> skipped
            {importResult.errors.length > 0 && <span className="ml-1 text-red-500">, {importResult.errors.length} errors</span>}
          </p>
          <button onClick={() => setImportResult(null)} className="ml-4 text-green-500 hover:text-green-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-red-500">{error}</div>
        ) : (
          <table className="w-full whitespace-nowrap text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Company Name", "Website", "Industry", "Contacts", "Deals", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                    No companies yet — click "+ Add Company" to get started.
                  </td>
                </tr>
              ) : (
                companies.map(company => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-800">{company.name}</td>
                    <td className="px-5 py-4 text-gray-500">{company.website || "—"}</td>
                    <td className="px-5 py-4 text-gray-500">{company.industry || "—"}</td>
                    <td className="px-5 py-4 text-gray-600">{company._count?.contacts ?? 0}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {(company.wonDealsCount ?? 0) > 0 ? company.wonDealsCount : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewItem(company)} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                          <Eye size={13} /> View
                        </button>
                        <button onClick={() => setEditItem(company)} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                          <Pencil size={13} /> Edit
                        </button>
                        <button onClick={() => setDeleteItem(company)} className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
