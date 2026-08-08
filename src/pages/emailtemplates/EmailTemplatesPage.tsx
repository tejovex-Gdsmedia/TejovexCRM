import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X, Trash2, Edit2, Mail } from 'lucide-react';

const BASE_URL = 'https://tejovexcrm-backend.onrender.com/api/v1';
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

type EmailStage =
  | 'INITIAL_OUTREACH' | 'FOLLOWUP_1' | 'FOLLOWUP_2' | 'FOLLOWUP_3'
  | 'REENGAGEMENT' | 'POST_MEETING' | 'PROPOSAL_SENT' | 'CLOSING' | 'CUSTOM';

const STAGE_LABELS: Record<EmailStage, string> = {
  INITIAL_OUTREACH: 'Initial Outreach',
  FOLLOWUP_1: 'Follow Up 1',
  FOLLOWUP_2: 'Follow Up 2',
  FOLLOWUP_3: 'Follow Up 3',
  REENGAGEMENT: 'Re-engagement',
  POST_MEETING: 'Post Meeting',
  PROPOSAL_SENT: 'Proposal Sent',
  CLOSING: 'Closing',
  CUSTOM: 'Custom',
};

const STAGE_DESCRIPTIONS: Record<EmailStage, string> = {
  INITIAL_OUTREACH: 'First ever contact, curiosity-driven, no hard sell',
  FOLLOWUP_1: 'Gentle nudge after no response (Day 3–5)',
  FOLLOWUP_2: 'Different angle, add value (Day 7–10)',
  FOLLOWUP_3: 'Last attempt, breakup-style email (Day 14)',
  REENGAGEMENT: 'Cold lead, fresh start weeks later',
  POST_MEETING: 'Thank you + next steps after a call or demo',
  PROPOSAL_SENT: 'Confirm receipt, offer to walk through',
  CLOSING: 'Final push near deal close',
  CUSTOM: 'Write your own from scratch',
};

interface EmailTemplate {
  id: string;
  name: string;
  stage: EmailStage;
  subject: string;
  body: string;
  isActive: boolean;
  createdBy?: { firstName: string; lastName: string };
  createdAt: string;
}

const emptyForm = {
  name: '',
  stage: 'INITIAL_OUTREACH' as EmailStage,
  subject: '',
  body: '',
  isActive: true,
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<EmailTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = filterStage ? { stage: filterStage } : {};
      const res = await axios.get(`${BASE_URL}/email-templates`, {
        ...getAuthHeaders(),
        params,
      });
      setTemplates(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, [filterStage]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (t: EmailTemplate) => {
    setEditTarget(t);
    setForm({
      name: t.name,
      stage: t.stage,
      subject: t.subject,
      body: t.body,
      isActive: t.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.subject || !form.body) {
      alert('Name, subject, and body are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editTarget) {
        await axios.patch(
          `${BASE_URL}/email-templates/${editTarget.id}`,
          form,
          getAuthHeaders()
        );
      } else {
        await axios.post(`${BASE_URL}/email-templates`, form, getAuthHeaders());
      }
      setShowModal(false);
      fetchTemplates();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

const handleDelete = async () => {
  if (!deletingTemplate) return;
  await axios.delete(`${BASE_URL}/email-templates/${deletingTemplate.id}`, getAuthHeaders());
  setDeletingTemplate(null);
  fetchTemplates();
};

  const groupedByStage = templates.reduce((acc, t) => {
    if (!acc[t.stage]) acc[t.stage] = [];
    acc[t.stage].push(t);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Email Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage reusable email templates for each follow-up stage
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> New Template
        </button>
      </div>

      {/* Variables Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
        <p className="text-sm font-medium text-amber-800 mb-1">Available Variables</p>
        <p className="text-xs text-amber-700 font-mono">
          {'{{lead.firstName}}'} &nbsp;
          {'{{lead.lastName}}'} &nbsp;
          {'{{lead.company}}'} &nbsp;
          {'{{lead.email}}'} &nbsp;
          {'{{contact.firstName}}'} &nbsp;
          {'{{deal.name}}'} &nbsp;
          {'{{user.firstName}}'}
        </p>
        <p className="text-xs text-amber-600 mt-1">
          These are automatically replaced with real data when a follow-up is created.
        </p>
      </div>

      {/* Stage Filter */}
      <div className="mb-5">
        <select
          value={filterStage}
          onChange={e => setFilterStage(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Stages</option>
          {Object.entries(STAGE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Mail size={40} className="mx-auto mb-3 opacity-30" />
          <p>No templates yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByStage).map(([stage, stageTemplates]) => (
            <div key={stage}>
              <div className="mb-3">
                <h2 className="text-base font-semibold text-gray-800">
                  {STAGE_LABELS[stage as EmailStage]}
                </h2>
                <p className="text-xs text-gray-500">
                  {STAGE_DESCRIPTIONS[stage as EmailStage]}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {stageTemplates.map(t => (
                  <div
                    key={t.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{t.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{t.subject}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                      {t.body.replace(/<[^>]+>/g, '').substring(0, 100)}...
                    </p>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => setPreview(t)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => openEdit(t)}
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 ml-auto"
                      >
                        <Edit2 size={11} /> Edit
                      </button>
                      <button
                        onClick={() => setDeletingTemplate(t)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                {editTarget ? 'Edit Template' : 'New Template'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Quick check-in"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage *</label>
                  <select
                    value={form.stage}
                    onChange={e => setForm(p => ({ ...p, stage: e.target.value as EmailStage }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(STAGE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="e.g. Quick question, {{lead.firstName}}"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  rows={10}
                  placeholder={`Hi {{lead.firstName}},\n\nI came across {{lead.company}} and wanted to reach out...\n\nBest,\n{{user.firstName}}`}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use {'{{lead.firstName}}'}, {'{{lead.company}}'}, {'{{user.firstName}}'} for dynamic values.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active (available to use in follow-ups)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editTarget ? 'Update' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800">
                Preview — {preview.name}
              </h2>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Subject</p>
              <p className="text-sm font-medium text-gray-800 mb-4 p-3 bg-gray-50 rounded-lg">
                {preview.subject}
              </p>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Body</p>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 font-sans">
                {preview.body}
              </pre>
            </div>
          </div>
        </div>
      )}

      {deletingTemplate && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete Template</h2>
      <p className="text-sm text-gray-600 mb-5">Are you sure you want to delete <strong>{deletingTemplate.name}</strong>? This cannot be undone.</p>
      <div className="flex gap-3">
        <button onClick={() => setDeletingTemplate(null)} className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
        <button onClick={handleDelete} className="flex-1 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">Yes, Delete</button>
      </div>
    </div>
  </div>
)}



    </div>
  );
}