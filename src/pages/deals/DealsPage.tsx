import { useState, useEffect, useRef } from "react";import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios"; // ADD: for API calls

// Types
type DealStatus = "OPEN" | "WON" | "LOST";

interface Deal {
  id: string;
  title: string;
  value: number;
  contactName: string | null;                 // CHANGED: contact → contactName
  probability: number;
  status: DealStatus;
  stageId: string;                            // CHANGED: stage name → stageId (UUID)
  stage: { id: string; name: string };        // ADD: stage object from backend response
}

interface Stage {
  id: string;
  name: string;
}

// Schema
const dealSchema = z.object({
  title:       z.string().min(2, "Title is required"),
  value:       z.coerce.number().min(0, "Value must be positive"),
  contactName: z.string().optional(),         // CHANGED: contact → contactName, made optional
  probability: z.coerce.number().min(0).max(100),
  status:      z.enum(["OPEN", "WON", "LOST"]),
  stageId:     z.string().min(1, "Stage is required"), // CHANGED: stage → stageId
});

type DealFormData = z.infer<typeof dealSchema>;

// Same as ContactsPage.tsx — hardcoded until login is connected
const API = "https://tejovexcrm-backend.onrender.com/api/v1";
const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } });

// Style Maps — UNCHANGED
const statusStyles: Record<DealStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  WON:  "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

const progressColors: Record<DealStatus, string> = {
  OPEN: "bg-orange-400",
  WON:  "bg-green-500",
  LOST: "bg-red-400",
};

export default function DealsPage() {
  const [deals, setDeals]   = useState<Deal[]>([]);   // CHANGED: removed initialDeals hardcode
  const [stages, setStages] = useState<Stage[]>([]);  // CHANGED: removed initialStages hardcode
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [editingDeal, setEditingDeal]         = useState<Deal | null>(null);
  const [showManageStages, setShowManageStages] = useState(false);
  const [newStageName, setNewStageName]       = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
  });

  // ADD: fetch deals and pipeline stages from backend on page load
  useEffect(() => {
    axios.get(`${API}/deals`, getAuthHeaders())
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setDeals(data);
      })
      .catch((err) => console.error("Deals fetch error:", err));

    axios.get(`${API}/pipeline-stages`, getAuthHeaders())
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setStages(data);
      })
      .catch((err) => console.error("Stages fetch error:", err));
  }, []);

  const openAdd = () => {
    setEditingDeal(null);
    reset({
      title:       "",
      value:       0,
      contactName: "",                    // CHANGED: contact → contactName
      probability: 0,
      status:      "OPEN",
      stageId:     stages[0]?.id || "",  // CHANGED: stage name → stageId
    });
    setIsModalOpen(true);
  };

  const openEdit = (deal: Deal) => {
    setEditingDeal(deal);
    reset({
      title:       deal.title,
      value:       deal.value,
      contactName: deal.contactName || "", // CHANGED: contact → contactName
      probability: deal.probability,
      status:      deal.status,
      stageId:     deal.stageId,          // CHANGED: stage name → stageId
    });
    setIsModalOpen(true);
  };

  // CHANGED: onSubmit now calls backend API instead of updating local state
  const onSubmit = async (data: DealFormData) => {
    try {
      const payload = {
        title:       data.title,
        value:       data.value,
        contactName: data.contactName || undefined, // plain text, no lookup needed
        probability: data.probability,
        status:      data.status,
        stageId:     data.stageId,
      };

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
      console.error("Deal save error:", err);
      alert("Something went wrong. Check the console.");
    }
  };

  // CHANGED: handleDelete now calls backend API
  const handleDelete = async (id: string) => {
    if (confirm("Delete this deal?")) {
      try {
        await axios.delete(`${API}/deals/${id}`, getAuthHeaders());
        setDeals((prev) => prev.filter((d) => d.id !== id));
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  // Manage Stages handlers — local state only (stages are seeded in DB)
const handleRemoveStage = async (stageId: string) => {
    const hasDeals = deals.some((d) => d.stageId === stageId);
    if (hasDeals) {
      alert("Cannot remove stage with existing deals!");
      return;
    }

    // Calculate updated list first
    const updatedStages = stages.filter((s) => s.id !== stageId);

    try {
      // Sync to backend — send only names
      const res = await axios.post(
        `${API}/pipeline-stages/sync`,
        { stages: updatedStages.map((s) => s.name) },
        getAuthHeaders()
      );
      // Update local state with real DB response (has proper IDs)
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setStages(data);
    } catch (err) {
      console.error("Stage remove error:", err);
      alert("Failed to remove stage. Try again.");
    }
  };

const handleAddStage = async () => {
    if (!newStageName.trim()) return;

    // Calculate updated list first
    const updatedStages = [...stages, { id: "", name: newStageName.trim() }];

    try {
      // Sync to backend — send only names
      const res = await axios.post(
        `${API}/pipeline-stages/sync`,
        { stages: updatedStages.map((s) => s.name) },
        getAuthHeaders()
      );
      // Update local state with real DB response (has proper IDs)
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setStages(data);
      setNewStageName("");
    } catch (err) {
      console.error("Stage add error:", err);
      alert("Failed to add stage. Try again.");
    }
  };


  const dragStageIndex = useRef<number | null>(null);
  const dragDealId = useRef<string | null>(null);

const handleDragStart = (index: number) => {
  dragStageIndex.current = index;
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
};

const handleDrop = async (index: number) => {
  if (dragStageIndex.current === null || dragStageIndex.current === index) return;

  const reordered = [...stages];
  const [moved] = reordered.splice(dragStageIndex.current, 1);
  reordered.splice(index, 0, moved);
  dragStageIndex.current = null;

  // Update local state immediately
  setStages(reordered);

  // Save new order to backend
  try {
    await axios.patch(
      `${API}/pipeline-stages/reorder`,
      { stages: reordered.map((s, i) => ({ id: s.id, order: i + 1 })) },
      getAuthHeaders()
    );
  } catch (err) {
    console.error("Reorder failed:", err);
    alert("Failed to save new order. Try again.");
  }
};

const handleDealDragStart = (dealId: string) => {
  dragDealId.current = dealId;
};

const handleDealDrop = async (e: React.DragEvent, stageId: string) => {
  e.stopPropagation();
  if (!dragDealId.current) return;
  const dealId = dragDealId.current;
  dragDealId.current = null;

  // Update local state immediately
  setDeals(prev =>
    prev.map(d => d.id === dealId ? { ...d, stageId } : d)
  );

  // Save to backend
  try {
    await axios.put(
      `${API}/deals/${dealId}`,
      { stageId },
      getAuthHeaders()
    );
  } catch (err) {
    console.error("Deal stage update failed:", err);
    alert("Failed to move deal. Try again.");
  }
};

  return (
    <div className="p-6 max-w-full">

      {/* Header — UNCHANGED */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals — Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">Kanban view of your sales pipeline across stages.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowManageStages(!showManageStages)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${showManageStages ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
          >
            Manage Stages
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + New Deal
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stageId === stage.id); // CHANGED: d.stage === name → d.stageId === id
          return (
            <div
  key={stage.id}
  className="min-w-[220px] w-[220px] flex-shrink-0"
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => handleDealDrop(e, stage.id)}
>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">{stage.name}</h3>
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">{stageDeals.length}</span>
              </div>

              <div className="space-y-3">
                {stageDeals.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 text-center text-xs text-gray-400">
                    No deals
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <div
  key={deal.id}
  draggable
  onDragStart={() => handleDealDragStart(deal.id)}
  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-grab"
  onClick={() => openEdit(deal)}
>
                      <p className="text-sm font-medium text-gray-900 mb-1 leading-tight">{deal.title}</p>
                      <p className="text-orange-500 font-bold text-sm mb-2">₹{deal.value?.toLocaleString("en-IN") || 0}</p>

                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                        <div
                          className={`h-1.5 rounded-full ${progressColors[deal.status]}`}
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">{deal.contactName || "—"}</p> {/* CHANGED: deal.contact → deal.contactName */}
                        <p className="text-xs text-gray-400">{deal.probability}%</p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[deal.status]}`}>
                          {deal.status}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(deal.id); }}
                          className="text-xs text-red-400 hover:text-red-600 transition"
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

      {/* Manage Stages — UNCHANGED except filter fix */}
      {showManageStages && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Manage Pipeline Stages</h2>
          <div className="space-y-2 max-w-2xl">
            {stages.map((stage, index) => (
              <div
  key={stage.id}
  draggable
  onDragStart={() => handleDragStart(index)}
  onDragOver={handleDragOver}
  onDrop={() => handleDrop(index)}
  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 cursor-grab"
>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-medium flex items-center justify-center">{index + 1}</span>
                  <span className="text-sm font-medium text-gray-800">{stage.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">
                    {deals.filter((d) => d.stageId === stage.id).length} deal{deals.filter((d) => d.stageId === stage.id).length !== 1 ? "s" : ""} {/* CHANGED */}
                  </span>
                  <button
                    onClick={() => handleRemoveStage(stage.id)}
                    className="text-sm text-gray-500 border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 transition"
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
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button onClick={handleAddStage} className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition">
                Add Stage
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
              <h2 className="text-lg font-semibold text-gray-800">{editingDeal ? "Edit Deal" : "New Deal"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Title</label>
                <input {...register("title")} placeholder="Deal title" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Value (₹)</label>
                <input {...register("value")} type="number" placeholder="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Contact</label>
                <input {...register("contactName")} placeholder="Contact name" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" /> {/* CHANGED: register("contact") → register("contactName") */}
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Probability (%)</label>
                <input {...register("probability")} type="number" placeholder="0" min="0" max="100" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Status</label>
                <select {...register("status")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="OPEN">OPEN</option>
                  <option value="WON">WON</option>
                  <option value="LOST">LOST</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Stage</label>
                <select {...register("stageId")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"> {/* CHANGED: register("stage") → register("stageId") */}
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option> 
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">{editingDeal ? "Save Changes" : "Add Deal"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}