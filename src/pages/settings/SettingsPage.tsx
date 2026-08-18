import { useEffect, useState } from 'react';
import axios from 'axios';
import { Settings, Wifi, WifiOff } from 'lucide-react';

const API = 'https://tejovexcrm-backend.onrender.com/api/v1';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

interface CrmSettings {
  whatsappEnabled: boolean;
  whatsappPhoneNumberId: string;
  whatsappAccessToken: string;
  whatsappTemplateName: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<CrmSettings>({
    whatsappEnabled: false,
    whatsappPhoneNumberId: '',
    whatsappAccessToken: '',
    whatsappTemplateName: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    axios
      .get(`${API}/settings`, getAuthHeaders())
      .then((res) => setSettings(res.data.data))
      .catch(() => setMessage({ type: 'error', text: 'Failed to load settings' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await axios.patch(`${API}/settings`, settings, getAuthHeaders());
      setSettings(res.data.data);
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-gray-600" />
        <h1 className="text-2xl font-semibold text-gray-800">CRM Settings</h1>
      </div>

      {/* WhatsApp Auto-Send Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-800">WhatsApp Auto-Send</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Automatically send a WhatsApp message when a new lead is created
            </p>
          </div>
          {/* Toggle */}
          <button
            onClick={() =>
              setSettings((prev) => ({ ...prev, whatsappEnabled: !prev.whatsappEnabled }))
            }
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
              settings.whatsappEnabled ? 'bg-green-500' : 'bg-gray-300'
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
        <div className={`flex items-center gap-2 text-sm ${settings.whatsappEnabled ? 'text-green-600' : 'text-gray-400'}`}>
          {settings.whatsappEnabled ? (
            <><Wifi className="w-4 h-4" /> Auto-send is ON — messages will fire on lead creation</>
          ) : (
            <><WifiOff className="w-4 h-4" /> Auto-send is OFF</>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Credentials */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">
            WhatsApp API Credentials{' '}
            <span className="text-gray-400 font-normal">(provided by your Meta admin)</span>
          </p>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Phone Number ID</label>
            <input
              type="text"
              value={settings.whatsappPhoneNumberId}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, whatsappPhoneNumberId: e.target.value }))
              }
              placeholder="e.g. 123456789012345"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Access Token</label>
            <input
              type="password"
              value={settings.whatsappAccessToken}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, whatsappAccessToken: e.target.value }))
              }
              placeholder="Permanent system user token"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Approved Template Name</label>
            <input
              type="text"
              value={settings.whatsappTemplateName}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, whatsappTemplateName: e.target.value }))
              }
              placeholder="e.g. lead_welcome_message"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`text-sm px-4 py-2.5 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}