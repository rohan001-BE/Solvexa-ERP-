"use client";

import { useState, useEffect } from "react";
import { getAllCMSContent, updateCMSContent, CMSContent } from "@/app/actions/cms";
import { ProtectedRoute } from "@/components/layout/protected-route";
import {
  LayoutTemplate,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  ExternalLink,
  Store,
  Layers,
  Wand2,
  FileText,
  PhoneCall,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";

export default function CMSPage() {
  const [content, setContent] = useState<CMSContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [feedback, setFeedback] = useState<{type: "success" | "error", message: string} | null>(null);

  // Form states
  const [formData, setFormData] = useState<Record<string, Partial<CMSContent>>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAllCMSContent();
      
      // If table is empty or missing, provide default placeholders
      const defaultSections = [
        { section_key: "hero", title: "Fresh Groceries Delivered Daily", subtitle: "Solvexa Grocery Store Enterprise Architecture", content_body: "Designed with royal purple and gold aesthetics, Solvexa Grocery ERP is built for high-throughput inventory management, atomic double-entry ledger bookkeeping, supplier logistics, and customer credit billing." },
        { section_key: "about", title: "About Solvexa Grocery", subtitle: "Quality You Can Trust", content_body: "Solvexa Grocery ERP is your one-stop solution for managing daily inventory, POS, and sales with ease and precision. We empower store managers and staff to streamline high-throughput checkout workflows." },
        { section_key: "contact", title: "Customer Support & Inquiries", subtitle: "We Are Always Available", content_body: "For order inquiries, bulk wholesale supply, or store partnerships, reach out to our dedicated support desk.\n\nEmail: support@solvexastore.com\nPhone: +92 300 1234567\nStore Address: Solvexa Main Market, Pakistan" }
      ];

      const mergedData = defaultSections.map(def => {
        const found = data.find(d => d.section_key === def.section_key);
        return found || ({ id: def.section_key, ...def, is_active: true, image_url: null } as CMSContent);
      });

      setContent(mergedData);
      
      const initialData: Record<string, Partial<CMSContent>> = {};
      mergedData.forEach(item => {
        initialData[item.section_key] = {
          title: item.title || "",
          subtitle: item.subtitle || "",
          content_body: item.content_body || "",
        };
      });
      setFormData(initialData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (sectionKey: string, field: keyof CMSContent, value: string) => {
    setFormData(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [field]: value
      }
    }));
  };

  const handleSave = async (sectionKey: string) => {
    setSaving(sectionKey);
    setFeedback(null);
    try {
      await updateCMSContent(sectionKey, formData[sectionKey]);
      setFeedback({ type: "success", message: `Successfully updated ${sectionKey.toUpperCase()} section! Changes are live on the store page.` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save content" });
    } finally {
      setSaving(null);
    }
  };

  const applyPreset = (sectionKey: string, preset: { title: string; subtitle: string; content_body: string }) => {
    setFormData(prev => ({
      ...prev,
      [sectionKey]: preset
    }));
  };

  const currentForm = formData[activeSection] || {};

  return (
    <ProtectedRoute permission="manage_settings">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header with Navigation and Live View Links */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-950 text-amber-300 flex items-center justify-center shadow-lg shadow-purple-950/20">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
                <span>Content Management System (CMS)</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h1>
              <p className="text-xs text-slate-500">
                Customize live banners, store announcements, and public About Us page content in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/about"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-900 hover:bg-purple-50 text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              <Eye className="w-4 h-4 text-purple-700" />
              <span>Preview Live Page</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 shadow-sm ${
            feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
            <span className="font-bold flex-1">{feedback.message}</span>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs">
          {[
            { id: "hero", label: "Hero Banner & Tagline", icon: Sparkles },
            { id: "about", label: "About Us Story & Mission", icon: FileText },
            { id: "contact", label: "Contact & Store Support", icon: PhoneCall },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeSection === tab.id
                  ? "bg-purple-900 text-amber-300 shadow-md shadow-purple-900/20"
                  : "text-slate-600 hover:text-purple-950 hover:bg-purple-50/60"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-600" />
            <p className="text-xs font-medium text-slate-600">Loading CMS content modules...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: EDIT FORM */}
            <div className="lg:col-span-7 space-y-6">
              <div className="solvexa-card p-6 bg-white border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-purple-950 uppercase tracking-wider">
                      Edit {activeSection} Content
                    </h3>
                    <p className="text-[11px] text-slate-500">Fill in the fields below to update website content</p>
                  </div>

                  <button
                    onClick={() => handleSave(activeSection)}
                    disabled={saving === activeSection}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-900/20 transition-all cursor-pointer"
                  >
                    {saving === activeSection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-amber-300" />}
                    <span>Save Changes</span>
                  </button>
                </div>

                {/* Preset Quick Fill Templates */}
                {activeSection === "hero" && (
                  <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100/80 space-y-2">
                    <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1">
                      <Wand2 className="w-3 h-3 text-purple-700" />
                      Quick Templates
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applyPreset("hero", {
                          title: "Ramadan Mubarak - Special Grocery Deals",
                          subtitle: "Solvexa Ramadan Mega Bazaar 2026",
                          content_body: "Avail up to 30% discount on all premium dates, pulses, cooking oils, and fresh farm dairy throughout the holy month of Ramadan."
                        })}
                        className="px-2.5 py-1 bg-white border border-purple-200 hover:bg-purple-100 text-purple-900 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        🌙 Ramadan Promotion
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("hero", {
                          title: "Fresh Farm Organic Groceries",
                          subtitle: "100% Guaranteed Fresh Daily",
                          content_body: "Direct from verified local farmers to your kitchen. High quality fruits, crisp vegetables, and artisanal bakery essentials."
                        })}
                        className="px-2.5 py-1 bg-white border border-purple-200 hover:bg-purple-100 text-purple-900 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        🥬 Fresh Farm Promo
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Section Header / Main Title
                    </label>
                    <input
                      type="text"
                      value={currentForm.title || ""}
                      onChange={(e) => handleUpdate(activeSection, 'title', e.target.value)}
                      placeholder="Enter main title..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Badge / Subtitle Highlight
                    </label>
                    <input
                      type="text"
                      value={currentForm.subtitle || ""}
                      onChange={(e) => handleUpdate(activeSection, 'subtitle', e.target.value)}
                      placeholder="Enter badge or subtitle..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Content Body &amp; Description
                    </label>
                    <textarea
                      rows={6}
                      value={currentForm.content_body || ""}
                      onChange={(e) => handleUpdate(activeSection, 'content_body', e.target.value)}
                      placeholder="Enter descriptive copy..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all resize-y leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: LIVE VISUAL PREVIEW */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-purple-700" />
                  Live Preview Card
                </span>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full font-mono">
                  Real-Time Mockup
                </span>
              </div>

              {activeSection === "hero" && (
                <div className="relative overflow-hidden solvexa-banner-dark p-6 text-white rounded-3xl shadow-xl border border-purple-900/50 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-300/40">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{currentForm.subtitle || "Badge Headline"}</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight leading-snug">
                    {currentForm.title || "Main Title Headline"}
                  </h2>
                  <p className="text-xs text-purple-100 leading-relaxed opacity-90 whitespace-pre-wrap">
                    {currentForm.content_body || "Content description body will show here exactly as formatted."}
                  </p>
                </div>
              )}

              {activeSection === "about" && (
                <div className="solvexa-card p-6 bg-white border border-purple-100 shadow-md space-y-3">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block font-mono">
                    {currentForm.subtitle || "Subtitle Highlight"}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    {currentForm.title || "About Title"}
                  </h3>
                  <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {currentForm.content_body || "About text details..."}
                  </div>
                </div>
              )}

              {activeSection === "contact" && (
                <div className="solvexa-card p-6 bg-white border border-purple-100 shadow-md space-y-3">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                    {currentForm.subtitle || "Support Desk"}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    {currentForm.title || "Contact Us"}
                  </h3>
                  <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                    {currentForm.content_body || "Contact details..."}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-[11px] text-amber-900 leading-relaxed">
                <strong>💡 Tip for Store Admins:</strong> Changes saved in this CMS module automatically update both the back-office information screens and public-facing storefront pages without requiring code redeployment.
              </div>
            </div>

          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
