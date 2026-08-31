"use client";

import { useState, useEffect } from "react";
import { getAllCMSContent, updateCMSContent, CMSContent } from "@/app/actions/cms";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { LayoutTemplate, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function CMSPage() {
  const [content, setContent] = useState<CMSContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
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
      setContent(data);
      
      const initialData: Record<string, Partial<CMSContent>> = {};
      data.forEach(item => {
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
      setFeedback({ type: "success", message: `Successfully updated ${sectionKey} content!` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save content" });
    } finally {
      setSaving(null);
    }
  };

  return (
    <ProtectedRoute permission="manage_settings">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Content Management</h1>
            <p className="text-sm text-slate-500">Manage the text and content displayed on the public website</p>
          </div>
        </div>

        {feedback && (
          <div className={`p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
            {feedback.message}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : content.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
            No CMS content found. Please run the cms_schema.sql script.
          </div>
        ) : (
          <div className="space-y-8">
            {content.map(section => (
              <div key={section.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    {section.section_key} Section
                  </h3>
                  <button
                    onClick={() => handleSave(section.section_key)}
                    disabled={saving === section.section_key}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    {saving === section.section_key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save {section.section_key}
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Title</label>
                    <input
                      type="text"
                      value={formData[section.section_key]?.title || ""}
                      onChange={(e) => handleUpdate(section.section_key, 'title', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Subtitle</label>
                    <input
                      type="text"
                      value={formData[section.section_key]?.subtitle || ""}
                      onChange={(e) => handleUpdate(section.section_key, 'subtitle', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Content Body</label>
                    <textarea
                      rows={4}
                      value={formData[section.section_key]?.content_body || ""}
                      onChange={(e) => handleUpdate(section.section_key, 'content_body', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
