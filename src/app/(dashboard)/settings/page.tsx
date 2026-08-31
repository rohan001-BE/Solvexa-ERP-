"use client";

import { useState, useEffect } from "react";
import { settingsService } from "@/services/settings.service";
import { Settings } from "@/types/database.types";
import { Store, Save, Loader2, CheckCircle2, Shield } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    store_name: "Solxa Grocery Store",
    store_address: "Solxa Main Market, Pakistan",
    store_phone: "+92 300 1234567",
    currency: "PKR",
    default_tax_rate: 0,
    low_stock_alert_enabled: true,
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      if (data) {
        setFormData({
          store_name: data.store_name || "Solxa Grocery Store",
          store_address: data.store_address || "",
          store_phone: data.store_phone || "",
          currency: data.currency || "PKR",
          default_tax_rate: Number(data.default_tax_rate || 0),
          low_stock_alert_enabled: data.low_stock_alert_enabled !== false,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSaved(false);
    try {
      await settingsService.updateSettings(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update settings");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute permission="manage_settings">
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-purple-700" />
            <span>Store Configuration &amp; Settings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure business identity, default currency, tax rates, and inventory alert parameters.
          </p>
        </div>

        <div className="solvexa-card p-6 border-purple-100 bg-white">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-purple-600" />
              <p className="text-xs font-medium text-slate-600">Loading store settings...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {saved && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Store configuration saved and updated successfully.</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Store / Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-purple-600 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.store_phone}
                    onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-purple-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operating Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-purple-950 font-bold rounded-xl px-3 py-2.5 outline-none focus:border-purple-600 font-mono"
                  >
                    <option value="PKR">PKR - Pakistani Rupee (Rs)</option>
                    <option value="USD">USD - US Dollar ($)</option>
                    <option value="EUR">EUR - Euro (€)</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Store Address</label>
                <input
                  type="text"
                  value={formData.store_address}
                  onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-purple-600"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Low Stock Alert Notifications</span>
                  <span className="text-slate-500 text-[11px]">
                    Highlight items falling below their minimum stock threshold in real-time.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.low_stock_alert_enabled}
                  onChange={(e) =>
                    setFormData({ ...formData, low_stock_alert_enabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-purple-700 focus:ring-purple-600 border-slate-300"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-purple-700/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
