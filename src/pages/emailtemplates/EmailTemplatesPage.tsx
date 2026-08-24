import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X, Trash2, Edit2, Mail } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const BASE_URL = 'https://tejovexcrm-backend.onrender.com/api/v1';
const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

type EmailStage =
  | 'INITIAL_OUTREACH' | 'FOLLOWUP_1' | 'FOLLOWUP_2' | 'FOLLOWUP_3'
  | 'REENGAGEMENT' | 'POST_MEETING' | 'PROPOSAL_SENT' | 'CLOSING' | 'CUSTOM';

const STAGE_LABELS: Record<EmailStage, string> = {
  INITIAL_OUTREACH: 'Initial Outreach', FOLLOWUP_1: 'Follow Up 1',
  FOLLOWUP_2: 'Follow Up 2', FOLLOWUP_3: 'Follow Up 3',
  REENGAGEMENT: 'Re-engagement', POST_MEETING: 'Post Meeting',
  PROPOSAL_SENT: 'Proposal Sent', CLOSING: 'Closing', CUSTOM: 'Custom',
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
  id: string; name: string; stage: EmailStage; subject: string;
  body: string; isActive: boolean;
  createdBy?: { firstName: string; lastName: string };
  createdAt: string;
}

const emptyForm = { name: '', stage: 'INITIAL_OUTREACH' as EmailStage, subject: '', body: '', isActive: true };

// ── Shared classes ──
const inputCls = "w-full border border-gray-300 dark:border-[#2e3245] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#111318] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-600";
const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
const modalCls = "bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-[#2e3245] rounded-xl shadow-xl w-full";

function RichTextEditor({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => { onChange(editor.getHTML()); },
  });

  const btnBase = "px-2 py-1 text-sm rounded transition-colors";
  const btnActive = "bg-brand-600/10 text-brand-600 dark:text-brand-400";
  const btnInactive = "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2e3245]";

  return (
    <div>
      {/* Toolbar */}
      <div className="flex gap-1 p-2 border border-gray-300 dark:border-[#2e3245] border-b-0 rounded-t-lg bg-gray-50 dark:bg-[#1A1D27]">
        <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`${btnBase} font-bold ${editor?.isActive('bold') ? btnActive : btnInactive}`}>B</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`${btnBase} italic ${editor?.isActive('italic') ? btnActive : btnInactive}`}>I</button>
        <div className="w-px bg-gray-300 dark:bg-[#2e3245] mx-1" />
        <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`${btnBase} ${editor?.isActive('bulletList') ? btnActive : btnInactive}`}>• List</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={`${btnBase} ${editor?.isActive('orderedList') ? btnActive : btnInactive}`}>1. List</button>
        <div className="w-px bg-gray-300 dark:bg-[#2e3245] mx-1" />
        <button type="button" onClick={() => editor?.chain().focus().unsetAllMarks().run()}
          className={`${btnBase} ${btnInactive}`}>Clear</button>
      </div>
      {/* Editor Area */}
      <EditorContent
        editor={editor}
        className="border border-gray-300 dark:border-[#2e3245] rounded-b-lg p-3 min-h-[220px] text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-[#111318] prose dark:prose-invert max-w-none cursor-text"
      />
    </div>
  );
}

export default function EmailTemplatesPage() {
  const [templates,         setTemplates]         = useState<EmailTemplate[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [filterStage,       setFilterStage]       = useState('');
  const [showModal,         setShowModal]         = useState(false);
  const [editTarget,        setEditTarget]        = useState<EmailTemplate | null>(null);
  const [form,              setForm]              = useState(emptyForm);
  const [submitting,        setSubmitting]        = useState(false);
  const [preview,           setPreview]           = useState<EmailTemplate | null>(null);
  const [deletingTemplate,  setDeletingTemplate]  = useState<EmailTemplate | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = filterStage ? { stage: filterStage } : {};
      const res = await axios.get(`${BASE_URL}/email-templates`, { ...getAuthHeaders(), params });
      setTemplates(res.data?.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, [filterStage]);

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setShowModal(true); };
  const openEdit   = (t: EmailTemplate) => {
    setEditTarget(t);
    setForm({ name: t.name, stage: t.stage, subject: t.subject, body: t.body, isActive: t.isActive });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.subject || !form.body) { alert('Name, subject, and body are required.'); return; }
    setSubmitting(true);
    try {
      if (editTarget) {
        await axios.patch(`${BASE_URL}/email-templates/${editTarget.id}`, form, getAuthHeaders());
      } else {
        await axios.post(`${BASE_URL}/email-templates`, form, getAuthHeaders());
      }
      setShowModal(false); fetchTemplates();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    await axios.delete(`${BASE_URL}/email-templates/${deletingTemplate.id}`, getAuthHeaders());
    setDeletingTemplate(null); fetchTemplates();
  };

  const groupedByStage = templates.reduce((acc, t) => {
    if (!acc[t.stage]) acc[t.stage] = [];
    acc[t.stage].push(t);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Email Templates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage reusable email templates for each follow-up stage
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} /> New Template
        </button>
      </div>

      {/* Variables Info */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-5">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Available Variables</p>
        <p className="text-xs text-amber-700 dark:text-amber-400 font-mono">
          {'{{lead.firstName}}'} &nbsp; {'{{lead.lastName}}'} &nbsp; {'{{lead.company}}'} &nbsp;
          {'{{lead.email}}'} &nbsp; {'{{contact.firstName}}'} &nbsp; {'{{deal.name}}'} &nbsp; {'{{user.firstName}}'}
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
          These are automatically replaced with real data when a follow-up is created.
        </p>
      </div>

      {/* Stage Filter */}
      <div className="mb-5">
        <select
          value={filterStage}
          onChange={e => setFilterStage(e.target.value)}
          className="border border-gray-200 dark:border-[#2e3245] rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1A1D27] focus:outline-none focus:ring-2 focus:ring-brand-600"
        >
          <option value="">All Stages</option>
          {Object.entries(STAGE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <Mail size={40} className="mx-auto mb-3 opacity-30" />
          <p>No templates yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByStage).map(([stage, stageTemplates]) => (
            <div key={stage}>
              <div className="mb-3">
                <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                  {STAGE_LABELS[stage as EmailStage]}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {STAGE_DESCRIPTIONS[stage as EmailStage]}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {stageTemplates.map(t => (
                  <div
                    key={t.id}
                    className="bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-[#2e3245] rounded-xl p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{t.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{t.subject}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        t.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                      {t.body.replace(/<[^>]+>/g, '').substring(0, 100)}...
                    </p>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-[#2e3245]">
                      <button
                        onClick={() => setPreview(t)}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => openEdit(t)}
                        className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 ml-auto"
                      >
                        <Edit2 size={11} /> Edit
                      </button>
                      <button
                        onClick={() => setDeletingTemplate(t)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
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
          <div className={`${modalCls} max-w-2xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-[#2e3245]">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editTarget ? 'Edit Template' : 'New Template'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Template Name *</label>
                  <input
                    type="text" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Quick check-in"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Stage *</label>
                  <select
                    value={form.stage}
                    onChange={e => setForm(p => ({ ...p, stage: e.target.value as EmailStage }))}
                    className={inputCls}
                  >
                    {Object.entries(STAGE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Subject *</label>
                <input
                  type="text" value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="e.g. Quick question, {{lead.firstName}}"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Body *</label>
                <RichTextEditor value={form.body} onChange={val => setForm(p => ({ ...p, body: val }))} />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Use {'{{lead.firstName}}'}, {'{{lead.company}}'}, {'{{user.firstName}}'} for dynamic values.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox" id="isActive" checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="rounded accent-brand-600"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                  Active (available to use in follow-ups)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-[#2e3245]">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-[#2e3245] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1e2235]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit} disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50"
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
          <div className={`${modalCls} max-w-xl`}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-[#2e3245]">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                Preview — {preview.name}
              </h2>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide font-medium">Subject</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-4 p-3 bg-gray-50 dark:bg-[#111318] rounded-lg">
                {preview.subject}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide font-medium">Body</p>
              <div
                className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#111318] rounded-lg p-3 prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: preview.body }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className={`${modalCls} max-w-sm p-6`}>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Delete Template</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Are you sure you want to delete{' '}
              <strong className="text-gray-900 dark:text-white">{deletingTemplate.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingTemplate(null)}
                className="flex-1 py-2 text-sm border border-gray-300 dark:border-[#2e3245] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1e2235]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg"
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