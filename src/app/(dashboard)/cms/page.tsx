"use client";

import { useState, useEffect } from "react";
import {
  getAllCMSContent,
  updateCMSContent,
  createCMSPost,
  deleteCMSPost,
  toggleCMSStatus,
  CMSContent,
} from "@/app/actions/cms";
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
  Plus,
  Trash2,
  Edit2,
  Wand2,
  X,
  Layers,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Power,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const CMS_IMAGE_PRESETS = [
  { name: "Supermarket Produce", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80" },
  { name: "Harvest Fruits & Veg", url: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=1200&auto=format&fit=crop&q=80" },
  { name: "Bakery & Breads", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80" },
  { name: "Supermarket Aisles", url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80" },
  { name: "Fresh Vegetables", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80" },
  { name: "Cleaning & Care", url: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop&q=80" },
  { name: "Dairy & Cheese", url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80" },
  { name: "Fresh Beverages", url: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&auto=format&fit=crop&q=80" },
];

export default function CMSPage() {
  const [posts, setPosts] = useState<CMSContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Selected post for editing
  const [selectedPostKey, setSelectedPostKey] = useState<string>("hero");
  const [formData, setFormData] = useState<Record<string, Partial<CMSContent>>>({});

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSectionKey, setNewSectionKey] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newBadge, setNewBadge] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newButtonText, setNewButtonText] = useState("");
  const [newButtonUrl, setNewButtonUrl] = useState("/products");
  const [newContentBody, setNewContentBody] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAllCMSContent();
      setPosts(data);

      const initialData: Record<string, Partial<CMSContent>> = {};
      data.forEach((p) => {
        initialData[p.section_key] = {
          title: p.title || "",
          subtitle: p.subtitle || "",
          content_body: p.content_body || "",
          image_url: p.image_url || "",
          badge: p.badge || "",
          button_text: p.button_text || "",
          button_url: p.button_url || "",
        };
      });

      setFormData(initialData);

      if (data.length > 0 && !selectedPostKey) {
        setSelectedPostKey(data[0].section_key);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdate = (sectionKey: string, field: keyof CMSContent, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [field]: value,
      },
    }));
  };

  const handleSave = async (sectionKey: string) => {
    setSavingId(sectionKey);
    setFeedback(null);
    try {
      await updateCMSContent(sectionKey, formData[sectionKey]);
      setFeedback({
        type: "success",
        message: `Successfully saved [${sectionKey.toUpperCase()}]! Changes are immediately published to the Home Screen.`,
      });
      await loadData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save CMS post" });
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateNewPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionKey.trim() || !newTitle.trim() || !newContentBody.trim()) return;

    setCreating(true);
    setFeedback(null);

    try {
      const sanitizedKey = newSectionKey.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_");
      await createCMSPost({
        section_key: sanitizedKey,
        title: newTitle,
        subtitle: newSubtitle || undefined,
        content_body: newContentBody,
        image_url: newImageUrl || undefined,
        badge: newBadge || undefined,
        button_text: newButtonText || undefined,
        button_url: newButtonUrl || undefined,
      });

      setFeedback({
        type: "success",
        message: `New CMS Post [${sanitizedKey}] published to Home Screen successfully!`,
      });

      setIsCreateModalOpen(false);
      setNewSectionKey("");
      setNewTitle("");
      setNewSubtitle("");
      setNewBadge("");
      setNewImageUrl("");
      setNewButtonText("");
      setNewContentBody("");

      await loadData();
      setSelectedPostKey(sanitizedKey);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to create CMS post" });
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePost = async (id: string, key: string) => {
    if (["hero", "about", "contact"].includes(key)) {
      alert("Core system sections (hero, about, contact) cannot be deleted. You can deactivate them instead.");
      return;
    }
    if (!confirm(`Are you sure you want to delete post "${key}"?`)) return;

    try {
      await deleteCMSPost(id);
      setFeedback({ type: "success", message: `Post "${key}" deleted successfully.` });
      await loadData();
      if (selectedPostKey === key) {
        setSelectedPostKey("hero");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete post");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleCMSStatus(id, currentStatus);
      await loadData();
      setFeedback({
        type: "success",
        message: `Post visibility updated (${!currentStatus ? "Active / Visible on Home Screen" : "Hidden / Inactive"}).`,
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const currentForm = formData[selectedPostKey] || {};
  const currentPost = posts.find((p) => p.section_key === selectedPostKey);

  return (
    <ProtectedRoute permission="manage_settings">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header Banner */}
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
                Manage all promotional banners, announcements, and storefront sections displayed on the Public Home Screen.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setFeedback(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-900 hover:to-indigo-950 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-900/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Create New CMS Post</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-purple-200 text-purple-900 hover:bg-purple-50 text-xs font-bold rounded-xl shadow-2xs transition-all"
            >
              <Eye className="w-4 h-4 text-purple-700" />
              <span>View Live Home Screen</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center gap-3 shadow-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-bold flex-1">{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Post Selection Pills */}
        <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2.5 text-xs scrollbar-thin">
          {posts.map((post) => {
            const isSelected = selectedPostKey === post.section_key;
            return (
              <button
                key={post.id || post.section_key}
                onClick={() => setSelectedPostKey(post.section_key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-purple-900 text-amber-300 shadow-md shadow-purple-900/20 scale-[1.02]"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-purple-50/60 hover:text-purple-900"
                }`}
              >
                <span>{post.section_key.toUpperCase()}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    post.is_active ? "bg-emerald-400" : "bg-slate-300"
                  }`}
                  title={post.is_active ? "Active on Home Screen" : "Hidden"}
                />
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-600" />
            <p className="text-xs font-medium text-slate-600">Loading CMS posts from database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: POST EDITOR FORM */}
            <div className="lg:col-span-7 space-y-6">
              <div className="solvexa-card p-6 bg-white border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-purple-950 uppercase tracking-wider font-mono">
                        {selectedPostKey}
                      </h3>
                      {currentPost && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            currentPost.is_active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {currentPost.is_active ? "Live / Active" : "Draft / Hidden"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Configure text, images, and CTA action buttons for this Home Screen block
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentPost && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(currentPost.id, currentPost.is_active)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentPost.is_active
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                        title={currentPost.is_active ? "Hide from Home Screen" : "Publish to Home Screen"}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    )}

                    {currentPost && !["hero", "about", "contact"].includes(currentPost.section_key) && (
                      <button
                        type="button"
                        onClick={() => handleDeletePost(currentPost.id, currentPost.section_key)}
                        className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl border border-rose-200 cursor-pointer"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleSave(selectedPostKey)}
                      disabled={savingId === selectedPostKey}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 disabled:bg-slate-300 text-white text-xs font-black rounded-xl shadow-md shadow-purple-900/20 transition-all cursor-pointer"
                    >
                      {savingId === selectedPostKey ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 text-amber-300" />
                      )}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Main Headline / Post Title *
                    </label>
                    <input
                      type="text"
                      value={currentForm.title || ""}
                      onChange={(e) => handleUpdate(selectedPostKey, "title", e.target.value)}
                      placeholder="e.g. Fresh Farm Organic Groceries"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Subtitle / Tagline
                      </label>
                      <input
                        type="text"
                        value={currentForm.subtitle || ""}
                        onChange={(e) => handleUpdate(selectedPostKey, "subtitle", e.target.value)}
                        placeholder="e.g. Save up to 30% on All Pantry"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Badge Highlight Tag
                      </label>
                      <input
                        type="text"
                        value={currentForm.badge || ""}
                        onChange={(e) => handleUpdate(selectedPostKey, "badge", e.target.value)}
                        placeholder="e.g. 100% Organic & Farm Fresh"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  {/* Image URL & Internet Presets */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Featured Banner Image (Internet URL)
                    </label>
                    <div className="flex gap-3 items-center">
                      <div className="relative w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {currentForm.image_url ? (
                          <Image
                            src={currentForm.image_url}
                            alt="Banner Preview"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <input
                        type="url"
                        value={currentForm.image_url || ""}
                        onChange={(e) => handleUpdate(selectedPostKey, "image_url", e.target.value)}
                        placeholder="Paste image link (https://images.unsplash.com/...)"
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1">
                        <Wand2 className="w-3 h-3 text-amber-500" />
                        Quick Internet Banner Presets
                      </span>
                      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
                        {CMS_IMAGE_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleUpdate(selectedPostKey, "image_url", preset.url)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              currentForm.image_url === preset.url
                                ? "bg-purple-900 text-amber-300 shadow-xs"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-purple-50"
                            }`}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Call-to-Action Button Label
                      </label>
                      <input
                        type="text"
                        value={currentForm.button_text || ""}
                        onChange={(e) => handleUpdate(selectedPostKey, "button_text", e.target.value)}
                        placeholder="e.g. Shop Flash Deals"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Button Target Link
                      </label>
                      <input
                        type="text"
                        value={currentForm.button_url || ""}
                        onChange={(e) => handleUpdate(selectedPostKey, "button_url", e.target.value)}
                        placeholder="e.g. /products or /pos"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Descriptive Content Body *
                    </label>
                    <textarea
                      rows={5}
                      value={currentForm.content_body || ""}
                      onChange={(e) => handleUpdate(selectedPostKey, "content_body", e.target.value)}
                      placeholder="Enter detailed description..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 leading-relaxed resize-y"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: LIVE REAL-TIME PREVIEW CARD */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-purple-700" />
                  Live Preview on Storefront
                </span>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full font-mono">
                  {selectedPostKey.toUpperCase()} MOCKUP
                </span>
              </div>

              {/* Dynamic Preview Card */}
              <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-900 text-white shadow-xl border border-purple-900/50 p-6 space-y-4">
                {currentForm.image_url && (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-white/20 shadow-md">
                    <Image
                      src={currentForm.image_url}
                      alt="Banner Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {currentForm.badge && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-400 text-purple-950 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    <span>{currentForm.badge}</span>
                  </div>
                )}

                <h3 className="text-xl font-black tracking-tight leading-snug">
                  {currentForm.title || "Post Headline"}
                </h3>

                {currentForm.subtitle && (
                  <p className="text-xs font-bold text-amber-300/90">{currentForm.subtitle}</p>
                )}

                <p className="text-xs text-purple-100/80 leading-relaxed whitespace-pre-wrap">
                  {currentForm.content_body || "Content description body will display here."}
                </p>

                {currentForm.button_text && (
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-purple-950 font-black text-xs rounded-xl shadow-md">
                      <span>{currentForm.button_text}</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-950 space-y-1">
                <div className="font-black flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Real-Time Storefront Sync</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Saving any post instantly pushes updates to the live Public Home Screen and About Page.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* CREATE POST MODAL */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border-2 border-purple-300/50 space-y-5 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-purple-950 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-700" />
                  <span>Create New CMS Post / Banner</span>
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNewPost} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Section Identifier (Slug) *</label>
                    <input
                      type="text"
                      required
                      value={newSectionKey}
                      onChange={(e) => setNewSectionKey(e.target.value)}
                      placeholder="e.g. spring_sale_banner"
                      className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Badge Tag</label>
                    <input
                      type="text"
                      value={newBadge}
                      onChange={(e) => setNewBadge(e.target.value)}
                      placeholder="e.g. Special Announcement"
                      className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Post Title / Main Headline *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Solvexa Mega Savings Gala"
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Subtitle</label>
                  <input
                    type="text"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    placeholder="e.g. Flat 20% Discount on All Items"
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Banner Image URL (Internet link)</label>
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Button Text</label>
                    <input
                      type="text"
                      value={newButtonText}
                      onChange={(e) => setNewButtonText(e.target.value)}
                      placeholder="e.g. Shop Now"
                      className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Button Link URL</label>
                    <input
                      type="text"
                      value={newButtonUrl}
                      onChange={(e) => setNewButtonUrl(e.target.value)}
                      placeholder="/products"
                      className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Content Description Body *</label>
                  <textarea
                    required
                    rows={4}
                    value={newContentBody}
                    onChange={(e) => setNewContentBody(e.target.value)}
                    placeholder="Enter descriptive copy..."
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none leading-relaxed resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black shadow-md shadow-purple-700/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Publish Post</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
