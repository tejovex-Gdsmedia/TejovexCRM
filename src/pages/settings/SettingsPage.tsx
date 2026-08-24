import { useEffect, useState } from 'react';
import axios from 'axios';
import { Settings, Wifi, WifiOff } from 'lucide-react';

const API = 'https://tejovexcrm-backend.onrender.com/api/v1';
const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

interface CrmSettings {
  whatsappEnabled: boolean;
  whatsappPhoneNumberId: string;
  whatsappAccessToken: string;
  whatsappTemplateName: string;
    emailEnabled: boolean;
  smtpFromEmail: string;
}

// ── Shared classes ──
const inputCls = "w-full border border-gray-200 dark:border-[#2e3245] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#111318] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-600";
const labelCls = "block text-sm text-gray-600 dark:text-gray-400 mb-1";

export default function SettingsPage() {
  const [settings, setSettings] = useState<CrmSettings>({
    whatsappEnabled: false,
    whatsappPhoneNumberId: '',
    whatsappAccessToken: '',
    whatsappTemplateName: '',
        emailEnabled: false,
    smtpFromEmail: '',
  });
  const [loading,          setLoading]          = useState(true);
  const [savingWhatsapp,   setSavingWhatsapp]   = useState(false);
  const [savingEmail,      setSavingEmail]      = useState(false);
  const [whatsappMessage,  setWhatsappMessage]  = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailMessage,     setEmailMessage]     = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    axios
      .get(`${API}/settings`, getAuthHeaders())
      .then((res) => setSettings(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveWhatsapp = async () => {
    setSavingWhatsapp(true);
    setWhatsappMessage(null);
    try {
      const res = await axios.patch(`${API}/settings`, {
        whatsappEnabled:      settings.whatsappEnabled,
        whatsappPhoneNumberId: settings.whatsappPhoneNumberId,
        whatsappAccessToken:  settings.whatsappAccessToken,
        whatsappTemplateName: settings.whatsappTemplateName,
      }, getAuthHeaders());
      setSettings(res.data.data);
      setWhatsappMessage({ type: 'success', text: 'WhatsApp settings saved successfully' });
    } catch {
      setWhatsappMessage({ type: 'error', text: 'Failed to save WhatsApp settings' });
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const handleSaveEmail = async () => {
    setSavingEmail(true);
    setEmailMessage(null);
    try {
      const res = await axios.patch(`${API}/settings`, {
        emailEnabled: settings.emailEnabled,
        smtpFromEmail: settings.smtpFromEmail,
      }, getAuthHeaders());
      setSettings(res.data.data);
      setEmailMessage({ type: 'success', text: 'Email settings saved successfully' });
    } catch {
      setEmailMessage({ type: 'error', text: 'Failed to save email settings' });
    } finally {
      setSavingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">

      {/* Page Title */}
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">CRM Settings</h1>
      </div>

      {/* WhatsApp Card */}
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-[#2e3245] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-800 dark:text-white">WhatsApp Auto-Send</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Automatically send a WhatsApp message when a new lead is created
            </p>
          </div>
          {/* Toggle */}
          <button
            onClick={() => setSettings((prev) => ({ ...prev, whatsappEnabled: !prev.whatsappEnabled }))}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
              settings.whatsappEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                settings.whatsappEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Status indicator */}
        <div className={`flex items-center gap-2 text-sm ${
          settings.whatsappEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
        }`}>
          {settings.whatsappEnabled ? (
            <><Wifi className="w-4 h-4" /> Auto-send is ON — messages will fire on lead creation</>
          ) : (
            <><WifiOff className="w-4 h-4" /> Auto-send is OFF</>
          )}
        </div>

        <hr className="border-gray-100 dark:border-[#2e3245]" />

        {/* Credentials */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            WhatsApp API Credentials{' '}
            <span className="text-gray-400 dark:text-gray-500 font-normal">(provided by your Meta admin)</span>
          </p>

          <div>
            <label className={labelCls}>Phone Number ID</label>
            <input
              type="text"
              value={settings.whatsappPhoneNumberId}
              onChange={(e) => setSettings((prev) => ({ ...prev, whatsappPhoneNumberId: e.target.value }))}
              placeholder="e.g. 123456789012345"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Access Token</label>
            <input
              type="password"
              value={settings.whatsappAccessToken}
              onChange={(e) => setSettings((prev) => ({ ...prev, whatsappAccessToken: e.target.value }))}
              placeholder="Permanent system user token"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Approved Template Name</label>
            <input
              type="text"
              value={settings.whatsappTemplateName}
              onChange={(e) => setSettings((prev) => ({ ...prev, whatsappTemplateName: e.target.value }))}
              placeholder="e.g. lead_welcome_message"
              className={inputCls}
            />
          </div>
        </div>

        {whatsappMessage && (
          <div className={`text-sm px-4 py-2.5 rounded-lg ${
            whatsappMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {whatsappMessage.text}
          </div>
        )}

        <button
          onClick={handleSaveWhatsapp}
          disabled={savingWhatsapp}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          {savingWhatsapp ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Email Sender Card */}
      <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-[#2e3245] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-800 dark:text-white">Email Auto-Send</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Automatically send a greeting email when a new lead is created
            </p>
          </div>
          {/* Toggle */}
          <button
            onClick={() => setSettings((prev) => ({ ...prev, emailEnabled: !prev.emailEnabled }))}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
              settings.emailEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                settings.emailEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Status indicator */}
        <div className={`flex items-center gap-2 text-sm ${
          settings.emailEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
        }`}>
          {settings.emailEnabled ? (
            <><Wifi className="w-4 h-4" /> Auto-send is ON — emails will fire on lead creation</>
          ) : (
            <><WifiOff className="w-4 h-4" /> Auto-send is OFF</>
          )}
        </div>

        <hr className="border-gray-100 dark:border-[#2e3245]" />

        <div>
          <label className={labelCls}>Sender Email Address</label>
          <input
            type="email"
            value={settings.smtpFromEmail}
            onChange={(e) => setSettings((prev) => ({ ...prev, smtpFromEmail: e.target.value }))}
            placeholder="techgdsmedia@gmail.com"
            className={inputCls}
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Must be a verified sender in your Brevo account
          </p>
        </div>

        {emailMessage && (
          <div className={`text-sm px-4 py-2.5 rounded-lg ${
            emailMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {emailMessage.text}
          </div>
        )}

        <button
          onClick={handleSaveEmail}
          disabled={savingEmail}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          {savingEmail ? 'Saving...' : 'Save Email Settings'}
        </button>
      </div>

    </div>
  );
}