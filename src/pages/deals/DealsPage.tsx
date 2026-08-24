import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { Upload, Download, X } from "lucide-react";

type DealStatus = "OPEN" | "WON" | "LOST";

interface Deal {
  id: string;
  title: string;
  value: number;
  contactName: string | null;
  probability: number;
  status: DealStatus;
  stageId: string;
  stage: { id: string; name: string };
}

interface Stage {
  id: string;
  name: string;
}

const dealSchema = z.object({
  title:       z.string().min(2, "Title is required"),
  value:       z.coerce.number().min(0, "Value must be positive"),
  contactName: z.string().optional(),
  probability: z.coerce.number().min(0).max(100),
  status:      z.enum(["OPEN", "WON", "LOST"]),
  stageId:     z.string().min(1, "Stage is required"),
});

type DealFormData = z.infer<typeof dealSchema>;

const API = "https://tejovexcrm-backend.onrender.com/api/v1";
const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } });

const statusStyles: Record<DealStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  WON:  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  LOST: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const progressColors: Record<DealStatus, string> = {
  OPEN: "bg-brand-600",
  WON:  "bg-green-500",
  LOST: "bg-red-400",
};

const inputCls  = "w-full border border-gray-300 dark:border-[#2e3245] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#111318] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-600";
const selectCls = "w-full border border-gray-300 dark:border-[#2e3245] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#111318] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-600";
const labelCls  = "text-sm text-gray-600 dark:text-gray-400 mb-1 block";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim()); current = "";
    } else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

function parseCSVFile(text: string): string[][] {
  return text.split(/\r?\n/).filter((l) => l.trim()).map(parseCSVLine);
}

function findColumnIndex(headers: string[], ...aliases: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = lower.indexOf(alias.toLowerCase().trim());
    if (idx !== -1) return idx;
  }
  return -1;
}

const CSV_COLUMNS = ["Deal Name", "Contact", "Value", "Probability", "Stage", "Status"];
const VALID_STATUSES = ["OPEN", "WON", "LOST"];

function normalizeStatus(val: string): string {
  if (!val) return "OPEN";
  const cleaned = val.toUpperCase().replace(/[\s-]+/g, "_");
  return VALID_STATUSES.includes(cleaned) ? cleaned : "OPEN";
}

export default function DealsPage() {
  const [deals,  setDeals]  = useState<Deal[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [isModalOpen,      setIsModalOpen]      = useState(false);
  const [editingDeal,      setEditingDeal]      = useState<Deal | null>(null);
  const [showManageStages, setShowManageStages] = useState(false);
  const [newStageName,     setNewStageName]     = useState("");
  const [loading,          setLoading]          = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing,    setImporting]    = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: number } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
  });

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/deals`, getAuthHeaders()),
      axios.get(`${API}/pipeline-stages`, getAuthHeaders()),
    ])
      .then(([dealsRes, stagesRes]) => {
        setDeals(Array.isArray(dealsRes.data) ? dealsRes.data : dealsRes.data.data || []);
        setStages(Array.isArray(stagesRes.data) ? stagesRes.data : stagesRes.data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const rows = parseCSVFile(text);
      if (rows.length < 2) { setImportResult({ created: 0, skipped: 0, errors: 0 }); setImporting(false); return; }
      const headers  = rows[0];
      const dataRows = rows.slice(1);
      const nameIdx    = findColumnIndex(headers, "deal name", "dealname", "deal_name", "title", "name", "deal");
      const contactIdx = findColumnIndex(headers, "contact", "contact name", "contactname", "contact_name", "contact person");
      const valueIdx   = findColumnIndex(headers, "value", "deal value", "dealvalue", "deal_value", "amount", "revenue");
      const probIdx    = findColumnIndex(headers, "probability", "prob", "chance", "likelihood");
      const stageIdx   = findColumnIndex(headers, "stage", "pipeline stage", "pipelinestage", "pipeline_stage", "deal stage");
      const statusIdx  = findColumnIndex(headers, "status", "deal status", "dealstatus", "deal_status");
      const parsed = dataRows
        .filter((row) => row.some((cell) => cell.trim() !== ""))
        .map((row) => {
          const stageName    = stageIdx !== -1 ? row[stageIdx]?.trim() : "";
          const matchedStage = stages.find((s) => s.name.toLowerCase() === stageName.toLowerCase());
          return {
            title:       nameIdx    !== -1 ? row[nameIdx]?.trim() || "" : "",
            contactName: contactIdx !== -1 ? row[contactIdx]?.trim() || "" : "",
            value:       valueIdx   !== -1 ? parseFloat(row[valueIdx]?.replace(/[^0-9.]/g, "")) || 0 : 0,
            probability: probIdx    !== -1 ? Math.min(100, Math.max(0, parseInt(row[probIdx]) || 0)) : 0,
            stageId:     matchedStage?.id || stages[0]?.id || "",
            status:      statusIdx  !== -1 ? normalizeStatus(row[statusIdx]) : "OPEN",
          };
        });
      const validDeals = parsed.filter((d) => d.title.trim() !== "");
      const res = await axios.post(`${API}/deals/import`, { deals: validDeals }, getAuthHeaders());
      const dealsRes = await axios.get(`${API}/deals`, getAuthHeaders());
      setDeals(Array.isArray(dealsRes.data) ? dealsRes.data : dealsRes.data.data || []);
      setImportResult({ created: res.data?.created ?? validDeals.length, skipped: res.data?.skipped ?? 0, errors: res.data?.errors ?? 0 });
    } catch {
      setImportResult({ created: 0, skipped: 0, errors: 1 });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadSampleCSV = () => {
    const blob = new Blob([CSV_COLUMNS.join(",")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "deals_sample.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const openAdd = () => {
    setEditingDeal(null);
    reset({ title: "", value: 0, contactName: "", probability: 0, status: "OPEN", stageId: stages[0]?.id || "" });
    setIsModalOpen(true);
  };

  const openEdit = (deal: Deal) => {
    setEditingDeal(deal);
    reset({ title: deal.title, value: deal.value, contactName: deal.contactName || "", probability: deal.probability, status: deal.status, stageId: deal.stageId });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: DealFormData) => {
    try {
      const payload = { title: data.title, value: data.value, contactName: data.contactName || undefined, probability: data.probability, status: data.status, stageId: data.stageId };
      if (editingDeal) {
        const res = await axios.put(`${API}/deals/${editingDeal.id}`, payload, getAuthHeaders());
        setDeals((prev) => prev.map((d) => d.id === editingDeal.id ? res.data.data : d));
      } else {
        const res = await axios.post(`${API}/deals`, payload, getAuthHeaders());
        setDeals((prev) => [...prev, res.data.data]);
      }
      setIsModalOpen(false);
      setEditingDeal(null);
    } catch (err) {
      alert("Something went wrong. Check the console.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this deal?")) {
      try {
        await axios.delete(`${API}/deals/${id}`, getAuthHeaders());
        setDeals((prev) => prev.filter((d) => d.id !== id));
      } catch (err) { console.error("Delete error:", err); }
    }
  };

  const handleRemoveStage = async (stageId: string) => {
    if (deals.some((d) => d.stageId === stageId)) { alert("Cannot remove stage with existing deals!"); return; }
    const updatedStages = stages.filter((s) => s.id !== stageId);
    try {
      const res = await axios.post(`${API}/pipeline-stages/sync`, { stages: updatedStages.map((s) => s.name) }, getAuthHeaders());
      setStages(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch { alert("Failed to remove stage. Try again."); }
  };

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    const updatedStages = [...stages, { id: "", name: newStageName.trim() }];
    try {
      const res = await axios.post(`${API}/pipeline-stages/sync`, { stages: updatedStages.map((s) => s.name) }, getAuthHeaders());
      setStages(Array.isArray(res.data) ? res.data : res.data.data || []);
      setNewStageName("");
    } catch { alert("Failed to add stage. Try again."); }
  };

  const dragStageIndex = useRef<number | null>(null);
  const dragDealId     = useRef<string | null>(null);

  const handleDragStart     = (index: number) => { dragStageIndex.current = index; };
  const handleDragOver      = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDealDragStart = (dealId: string) => { dragDealId.current = dealId; };

  const handleDrop = async (index: number) => {
    if (dragStageIndex.current === null || dragStageIndex.current === index) return;
    const reordered = [...stages];
    const [moved] = reordered.splice(dragStageIndex.current, 1);
    reordered.splice(index, 0, moved);
    dragStageIndex.current = null;
    setStages(reordered);
    try {
      await axios.patch(`${API}/pipeline-stages/reorder`, { stages: reordered.map((s, i) => ({ id: s.id, order: i + 1 })) }, getAuthHeaders());
    } catch { alert("Failed to save new order. Try again."); }
  };

  const handleDealDrop = async (e: React.DragEvent, stageId: string) => {
    e.stopPropagation();
    if (!dragDealId.current) return;
    const dealId = dragDealId.current;
    dragDealId.current = null;
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stageId } : d));
    try {
      await axios.put(`${API}/deals/${dealId}`, { stageId }, getAuthHeaders());
    } catch { alert("Failed to move deal. Try again."); }
  };

  return (
    <div className="p-6 max-w-full">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deals — Pipeline</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kanban view of your sales pipeline across stages.</p>
        </div>

        {/* ── Button row: Sample CSV → Import CSV → Manage Stages → + New Deal ── */}
        <div className="flex gap-2">

          {/* Sample CSV — outline, left */}
          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-[#2e3245] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1e2235] transition"
          >
            <Download size={14} /> Sample CSV
          </button>

          {/* Hidden file input */}
          <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />

          {/* Import CSV — dark filled, right of Sample CSV */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-800 dark:bg-[#1A1D27] dark:border dark:border-[#2e3245] text-white rounded-lg hover:bg-gray-700 dark:hover:bg-[#1e2235] disabled:opacity-50 transition"
          >
            <Upload size={14} /> {importing ? "Importing..." : "Import CSV"}
          </button>

          <button
            onClick={() => setShowManageStages(!showManageStages)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
              showManageStages
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                : "bg-white dark:bg-[#1A1D27] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-[#2e3245] hover:bg-gray-50 dark:hover:bg-[#1e2235]"
            }`}
          >
            Manage Stages
          </button>

          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + New Deal
          </button>
        </div>
      </div>

      {/* Import Result Banner */}
      {importResult && (
        <div className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm mb-6 ${
          importResult.errors > 0
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
            : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
        }`}>
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {importResult.errors > 0 ? "Import completed with errors" : "Import successful"}
            </span>
            <span className="text-xs opacity-80">
              {importResult.created} created · {importResult.skipped} skipped · {importResult.errors} errors
            </span>
          </div>
          <button onClick={() => setImportResult(null)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Kanban Board */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageDeals = deals.filter((d) => d.stageId === stage.id);
              return (
                <div
                  key={stage.id}
                  className="min-w-[220px] w-[220px] flex-shrink-0"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDealDrop(e, stage.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{stage.name}</h3>
                    <span className="bg-gray-100 dark:bg-[#2e3245] text-gray-600 dark:text-gray-400 text-xs font-medium px-2 py-0.5 rounded-full">
                      {stageDeals.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {stageDeals.length === 0 ? (
                      <div className="bg-gray-50 dark:bg-[#1A1D27] border border-dashed border-gray-200 dark:border-[#2e3245] rounded-lg p-4 text-center text-xs text-gray-400 dark:text-gray-500">
                        No deals
                      </div>
                    ) : (
                      stageDeals.map((deal) => (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={() => handleDealDragStart(deal.id)}
                          className="bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-[#2e3245] rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-grab"
                          onClick={() => openEdit(deal)}
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 leading-tight">{deal.title}</p>
                          <p className="text-brand-600 font-bold text-sm mb-2">₹{deal.value?.toLocaleString("en-IN") || 0}</p>

                          <div className="w-full bg-gray-100 dark:bg-[#2e3245] rounded-full h-1.5 mb-2">
                            <div
                              className={`h-1.5 rounded-full ${progressColors[deal.status]}`}
                              style={{ width: `${deal.probability}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{deal.contactName || "—"}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{deal.probability}%</p>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[deal.status]}`}>
                              {deal.status}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(deal.id); }}
                              className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 transition"
                            >
                              Del
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Manage Stages */}
          {showManageStages && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Manage Pipeline Stages</h2>
              <div className="space-y-2 max-w-2xl">
                {stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    className="flex items-center justify-between bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-[#2e3245] rounded-lg px-4 py-3 cursor-grab"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#2e3245] text-gray-600 dark:text-gray-400 text-xs font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{stage.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {deals.filter((d) => d.stageId === stage.id).length} deal{deals.filter((d) => d.stageId === stage.id).length !== 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={() => handleRemoveStage(stage.id)}
                        className="text-sm text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-[#2e3245] px-3 py-1 rounded hover:bg-gray-50 dark:hover:bg-[#1e2235] transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-4">
                  <input
                    type="text"
                    placeholder="New stage name..."
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    className={inputCls}
                  />
                  <button
                    onClick={handleAddStage}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm rounded-lg transition"
                  >
                    Add Stage
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add/Edit Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-[#2e3245] rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {editingDeal ? "Edit Deal" : "New Deal"}
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
                    <label className={labelCls}>Title</label>
                    <input {...register("title")} placeholder="Deal title" className={inputCls} />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Value (₹)</label>
                    <input {...register("value")} type="number" placeholder="0" className={inputCls} />
                    {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Contact</label>
                    <input {...register("contactName")} placeholder="Contact name" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Probability (%)</label>
                    <input {...register("probability")} type="number" placeholder="0" min="0" max="100" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select {...register("status")} className={selectCls}>
                      <option value="OPEN">OPEN</option>
                      <option value="WON">WON</option>
                      <option value="LOST">LOST</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Stage</label>
                    <select {...register("stageId")} className={selectCls}>
                      {stages.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-sm border border-gray-300 dark:border-[#2e3245] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1e2235] transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition"
                    >
                      {editingDeal ? "Save Changes" : "Add Deal"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}