import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Phone, Mail, Users, CheckSquare, MessageSquare,
  CheckCircle2, Clock, AlertCircle, Plus, Trash2,
  CalendarClock, X,
} from 'lucide-react';

const BASE_URL = 'https://tejovexcrm-backend.onrender.com/api/v1';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

type FollowUpType = 'CALL' | 'EMAIL' | 'MEETING' | 'WHATSAPP' | 'SMS';
type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'SKIPPED';
type FollowUpPriority = 'LOW' | 'MEDIUM' | 'HIGH';
type EmailStage =
  | 'INITIAL_OUTREACH' | 'FOLLOWUP_1' | 'FOLLOWUP_2' | 'FOLLOWUP_3'
  | 'REENGAGEMENT' | 'POST_MEETING' | 'PROPOSAL_SENT' | 'CLOSING' | 'CUSTOM';

interface FollowUp {
  id: string;
  title: string;
  type: FollowUpType;
  status: FollowUpStatus;
  priority: FollowUpPriority;
  dueDate: string;
  scheduledAt?: string;
  completionNote?: string;
  completedAt?: string;
  emailStage?: EmailStage;
  emailSubject?: string;
  emailBody?: string;
  emailSentAt?: string;
  lead?: { id: string; title: string; contactName?: string };
  contact?: { id: string; firstName: string; lastName: string };
  deal?: { id: string; title: string };
  assignedTo?: { id: string; firstName: string; lastName: string };
  createdBy?: { id: string; firstName: string; lastName: string };
  emailTemplate?: { id: string; name: string; stage: string };
  createdAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  stage: EmailStage;
  subject: string;
  body: string;
}

interface Lead { id: string; title: string; contactName?: string; }
interface Contact { id: string; firstName: string; lastName: string; }

const TYPE_ICONS: Record<FollowUpType, JSX.Element> = {
  CALL: <Phone size={14} />,
  EMAIL: <Mail size={14} />,
  MEETING: <Users size={14} />,
  WHATSAPP: <MessageSquare size={14} />,
  SMS: <CheckSquare size={14} />,
};

const STATUS_CLASSES: Record<FollowUpStatus, string> = {
  PENDING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  SKIPPED: 'bg-gray-100 text-gray-600',
};

const PRIORITY_CLASSES: Record<FollowUpPriority, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
};

const EMAIL_STAGE_LABELS: Record<EmailStage, string> = {
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

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completeModal, setCompleteModal] = useState<FollowUp | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [deletingFollowUp, setDeletingFollowUp] = useState<FollowUp | null>(null);

  const [form, setForm] = useState({
    title: '',
    type: 'CALL' as FollowUpType,
    priority: 'MEDIUM' as FollowUpPriority,
    dueDate: '',
    scheduledAt: '',
    leadId: '',
    contactId: '',
    emailStage: '' as EmailStage | '',
    emailTemplateId: '',
    emailSubject: '',
    emailBody: '',
  });

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      const res = await axios.get(`${BASE_URL}/followups`, {
        ...getAuthHeaders(),
        params,
      });
      setFollowUps(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadsAndContacts = async () => {
    try {
      const [leadsRes, contactsRes] = await Promise.all([
        axios.get(`${BASE_URL}/leads`, getAuthHeaders()),
        axios.get(`${BASE_URL}/contacts`, getAuthHeaders()),
      ]);
      setLeads(leadsRes.data?.data || []);
      setContacts(contactsRes.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTemplatesByStage = async (stage: string) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/email-templates/by-stage/${stage}`,
        getAuthHeaders()
      );
      setTemplates(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchFollowUps(); }, [filterStatus, filterType]);
  useEffect(() => { fetchLeadsAndContacts(); }, []);

  const handleStageChange = (stage: EmailStage | '') => {
    setForm(p => ({
      ...p,
      emailStage: stage,
      emailTemplateId: '',
      emailSubject: '',
      emailBody: '',
    }));
    if (stage) fetchTemplatesByStage(stage);
    else setTemplates([]);
  };

  const handleTemplateSelect = (templateId: string) => {
    const t = templates.find(t => t.id === templateId);
    if (t) {
      setForm(p => ({
        ...p,
        emailTemplateId: templateId,
        emailSubject: t.subject,
        emailBody: t.body,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.dueDate || (!form.leadId && !form.contactId)) {
      alert('Title, due date, and at least one linked record are required.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        title: form.title,
        type: form.type,
        priority: form.priority,
        dueDate: form.dueDate,
        leadId: form.leadId || undefined,
        contactId: form.contactId || undefined,
      };
      if (form.scheduledAt) payload.scheduledAt = form.scheduledAt;
      if (form.type === 'EMAIL') {
        if (form.emailStage) payload.emailStage = form.emailStage;
        if (form.emailTemplateId) payload.emailTemplateId = form.emailTemplateId;
        if (form.emailSubject) payload.emailSubject = form.emailSubject;
        if (form.emailBody) payload.emailBody = form.emailBody;
      }
      await axios.post(`${BASE_URL}/followups`, payload, getAuthHeaders());
      setShowModal(false);
      setForm({
        title: '', type: 'CALL', priority: 'MEDIUM',
        dueDate: '', scheduledAt: '', leadId: '', contactId: '',
        emailStage: '', emailTemplateId: '', emailSubject: '', emailBody: '',
      });
      fetchFollowUps();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!completeModal) return;
    try {
      await axios.patch(
        `${BASE_URL}/followups/${completeModal.id}`,
        { status: 'COMPLETED', completionNote },
        getAuthHeaders()
      );
      setCompleteModal(null);
      setCompletionNote('');
      fetchFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

const handleDelete = async () => {
  if (!deletingFollowUp) return;
  await axios.delete(`${BASE_URL}/followups/${deletingFollowUp.id}`, getAuthHeaders());
  setDeletingFollowUp(null);
  fetchFollowUps();
};

  const getLinkedName = (fu: FollowUp) => {
    if (fu.lead) return fu.lead.contactName || fu.lead.title;
    if (fu.contact) return `${fu.contact.firstName} ${fu.contact.lastName}`;
    if (fu.deal) return fu.deal.title;
    return '—';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Follow-Ups</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track all outreach and communication touchpoints
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> New Follow-Up
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="OVERDUE">Overdue</option>
          <option value="COMPLETED">Completed</option>
          <option value="SKIPPED">Skipped</option>
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="CALL">Call</option>
          <option value="EMAIL">Email</option>
          <option value="MEETING">Meeting</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="SMS">SMS</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : followUps.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CalendarClock size={40} className="mx-auto mb-3 opacity-30" />
          <p>No follow-ups found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Linked To</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Due Date</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Priority</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {followUps.map(fu => (
                <tr key={fu.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{fu.title}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      {TYPE_ICONS[fu.type]} {fu.type}
                      {fu.emailStage && (
                        <span className="text-xs text-gray-400 ml-1">
                          ({EMAIL_STAGE_LABELS[fu.emailStage]})
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{getLinkedName(fu)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(fu.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_CLASSES[fu.priority]}`}>
                      {fu.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${STATUS_CLASSES[fu.status]}`}>
                      {fu.status === 'PENDING' && <Clock size={10} />}
                      {fu.status === 'OVERDUE' && <AlertCircle size={10} />}
                      {fu.status === 'COMPLETED' && <CheckCircle2 size={10} />}
                      {fu.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {(fu.status === 'PENDING' || fu.status === 'OVERDUE') && (
                        <button
                          onClick={() => setCompleteModal(fu)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100"
                        >
                          <CheckCircle2 size={12} /> Done
                        </button>
                      )}
                      <button
                        onClick={() => setDeletingFollowUp(fu)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">New Follow-Up</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Call Rahul about pricing"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(p => ({
                      ...p,
                      type: e.target.value as FollowUpType,
                      emailStage: '',
                      emailTemplateId: '',
                      emailSubject: '',
                      emailBody: '',
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CALL">📞 Call</option>
                    <option value="EMAIL">📧 Email</option>
                    <option value="MEETING">🤝 Meeting</option>
                    <option value="WHATSAPP">💬 WhatsApp</option>
                    <option value="SMS">📱 SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: e.target.value as FollowUpPriority }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {form.type === 'EMAIL' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Auto-send At</label>
                    <input
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link to Lead</label>
                  <select
                    value={form.leadId}
                    onChange={e => setForm(p => ({ ...p, leadId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select lead...</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.contactName || l.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link to Contact</label>
                  <select
                    value={form.contactId}
                    onChange={e => setForm(p => ({ ...p, contactId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select contact...</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email specific fields */}
              {form.type === 'EMAIL' && (
                <div className="border border-blue-100 rounded-lg p-4 bg-blue-50 space-y-3">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    Email Configuration
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Stage</label>
                    <select
                      value={form.emailStage}
                      onChange={e => handleStageChange(e.target.value as EmailStage | '')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select stage...</option>
                      {Object.entries(EMAIL_STAGE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {form.emailStage && templates.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pick a Template
                      </label>
                      <select
                        value={form.emailTemplateId}
                        onChange={e => handleTemplateSelect(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Select template...</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {form.emailStage && templates.length === 0 && (
                    <p className="text-xs text-gray-500">
                      No templates for this stage yet. Write manually below.
                    </p>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={form.emailSubject}
                      onChange={e => setForm(p => ({ ...p, emailSubject: e.target.value }))}
                      placeholder="Email subject..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                    <textarea
                      value={form.emailBody}
                      onChange={e => setForm(p => ({ ...p, emailBody: e.target.value }))}
                      rows={5}
                      placeholder="Email body... Use {{lead.firstName}}, {{lead.company}} etc."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Variables: {'{{lead.firstName}}'} {'{{lead.company}}'} {'{{user.firstName}}'}
                    </p>
                  </div>
                </div>
              )}
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
                {submitting ? 'Saving...' : 'Save Follow-Up'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {completeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Mark as Complete</h2>
              <button onClick={() => setCompleteModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-3">
                Completing: <span className="font-medium">{completeModal.title}</span>
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outcome / Note
              </label>
              <textarea
                value={completionNote}
                onChange={e => setCompletionNote(e.target.value)}
                rows={3}
                placeholder="What happened? What was discussed? Next steps?"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
              <button
                onClick={() => setCompleteModal(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}


      {deletingFollowUp && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete Follow-Up</h2>
      <p className="text-sm text-gray-600 mb-5">Are you sure you want to delete <strong>{deletingFollowUp.title}</strong>? This cannot be undone.</p>
      <div className="flex gap-3">
        <button onClick={() => setDeletingFollowUp(null)} className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
        <button onClick={handleDelete} className="flex-1 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">Yes, Delete</button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}