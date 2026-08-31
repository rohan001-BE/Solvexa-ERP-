"use client";

import { useState, useEffect } from "react";
import {
  getAllCMSContent,
  updateCMSContent,
  createCMSPost,
  deleteCMSPost,
  toggleCMSStatus,
} from "@/app/actions/cms";
import { CMSContent } from "@/lib/cms-constants";
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
  Smartphone,
  Monitor,
  ShoppingBag,
  Store,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Globe
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Categorized high-speed verified HTTPS CDN image presets (Unsplash)
const INTERNET_IMAGE_CATEGORIES = [
  {
    category: "Supermarket & Banners",
    items: [
      { name: "Supermarket Produce Aisle", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80" },
      { name: "Organic Grocery Harvest", url: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=1200&auto=format&fit=crop&q=80" },
      { name: "Supermarket Store Aisles", url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80" },
      { name: "Fresh Produce Display", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&auto=format&fit=crop&q=80" },
    ]
  },
  {
    category: "Fresh Farm Fruits & Veg",
    items: [
      { name: "Red Crisp Apples", url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&auto=format&fit=crop&q=80" },
      { name: "Fresh Farm Bananas", url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop&q=80" },
      { name: "Ripe Red Tomatoes", url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80" },
      { name: "Green Salad Veggies", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80" },
    ]
  },
  {
    category: "Bakery, Dairy & Pantry",
    items: [
      { name: "Artisanal Baked Breads", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80" },
      { name: "Farm Milk & Dairy", url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80" },
      { name: "Farm Fresh Brown Eggs", url: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&auto=format&fit=crop&q=80" },
      { name: "Basmati Rice & Grains", url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80" },
      { name: "Pure Cooking Oils", url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80" },
      { name: "Artisanal Cheeses", url: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=800&auto=format&fit=crop&q=80" },
    ]
  },
  {
    category: "Household, Care & Drinks",
    items: [
      { name: "Beverages & Juices", url: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&auto=format&fit=crop&q=80" },
      { name: "Cleaning Detergents", url: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop&q=80" },
      { name: "Fresh Meat & Poultry", url: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&auto=format&fit=crop&q=80" },
      { name: "Chai Tea & Herbs", url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80" },
    ]
  }
];

export default function CMSPage() {
  const [posts, setPosts] = useState<CMSContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Selected post for editing
  const [selectedPostKey, setSelectedPostKey] = useState<string>("hero");
  const [formData, setFormData] = useState<Record<string, Partial<CMSContent>>>({});

  // Preview Mode: Desktop vs Mobile
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>(INTERNET_IMAGE_CATEGORIES[0].category);

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
        message: `Successfully saved [${sectionKey.toUpperCase()}]! Changes are immediately live on the Public Home Screen.`,
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
        image_url: newImageUrl.trim() || undefined,
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
                Manage promotional banners, announcements, and storefront sections with real internet images and live previews.
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
              <span>Open Public Home Screen</span>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: POST EDITOR FORM (7 COLS) */}
            <div className="lg:col-span-6 space-y-6">
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
                      Configure text, verified internet image, and CTA action buttons
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
                      <span>Save &amp; Publish</span>
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

                  {/* Proper Internet Image URL & Presets Catalog */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-purple-700" />
                        <span>Internet Image URL (HTTPS CDN Link)</span>
                      </label>
                      {currentForm.image_url && (
                        <button
                          type="button"
                          onClick={() => handleUpdate(selectedPostKey, "image_url", "")}
                          className="text-[10px] text-rose-600 hover:underline font-bold"
                        >
                          Clear Image
                        </button>
                      )}
                    </div>

                    <div className="flex gap-3 items-center">
                      <div className="relative w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-2xs">
                        {currentForm.image_url ? (
                          <Image
                            src={currentForm.image_url}
                            alt="Banner Preview"
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <input
                          type="url"
                          value={currentForm.image_url || ""}
                          onChange={(e) => handleUpdate(selectedPostKey, "image_url", e.target.value)}
                          placeholder="Paste image link: https://images.unsplash.com/..."
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                        <span className="text-[10px] text-slate-400 block">
                          Tip: Uses direct cloud CDN URLs. No heavy image blobs stored in database.
                        </span>
                      </div>
                    </div>

                    {/* Categorized Image Presets Selector */}
                    <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-purple-950 uppercase tracking-wider flex items-center gap-1">
                          <Wand2 className="w-3.5 h-3.5 text-amber-500" />
                          <span>Internet Grocery Image Presets Catalog</span>
                        </span>
                      </div>

                      {/* Category selector */}
                      <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-thin">
                        {INTERNET_IMAGE_CATEGORIES.map((cat) => (
                          <button
                            key={cat.category}
                            type="button"
                            onClick={() => setSelectedCategoryTab(cat.category)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                              selectedCategoryTab === cat.category
                                ? "bg-purple-900 text-amber-300 shadow-xs"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-purple-50"
                            }`}
                          >
                            {cat.category}
                          </button>
                        ))}
                      </div>

                      {/* Image items in chosen category */}
                      <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                        {INTERNET_IMAGE_CATEGORIES.find((c) => c.category === selectedCategoryTab)?.items.map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => handleUpdate(selectedPostKey, "image_url", item.url)}
                            className={`p-1.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                              currentForm.image_url === item.url
                                ? "border-purple-600 bg-purple-100/70 text-purple-950 font-bold"
                                : "border-slate-200 bg-white hover:border-purple-300 text-slate-700"
                            }`}
                          >
                            <div className="relative w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                              <Image src={item.url} alt={item.name} fill sizes="28px" className="object-cover" />
                            </div>
                            <span className="text-[10px] truncate flex-1">{item.name}</span>
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

            {/* RIGHT COLUMN: REAL-TIME STOREFRONT LIVE MOCKUP ENGINE (6 COLS) */}
            <div className="lg:col-span-6 space-y-4 sticky top-24">
              
              {/* Mockup Toolbar */}
              <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black text-purple-950 uppercase tracking-wider">
                    Real-Time Storefront Mockup
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("desktop")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      previewMode === "desktop"
                        ? "bg-purple-900 text-amber-300 shadow-xs"
                        : "text-slate-600 hover:text-purple-950"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewMode("mobile")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      previewMode === "mobile"
                        ? "bg-purple-900 text-amber-300 shadow-xs"
                        : "text-slate-600 hover:text-purple-950"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>
              </div>

              {/* REAL MOCKUP CONTAINER */}
              <div
                className={`mx-auto transition-all duration-300 ${
                  previewMode === "mobile"
                    ? "max-w-xs bg-slate-950 p-3 rounded-[2.5rem] shadow-2xl border-4 border-slate-800"
                    : "w-full"
                }`}
              >
                {/* Mobile Status Bar Simulation */}
                {previewMode === "mobile" && (
                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-3 pb-2 pt-1 font-mono">
                    <span>9:41</span>
                    <div className="w-16 h-3.5 bg-slate-800 rounded-full mx-auto" />
                    <span>5G 100%</span>
                  </div>
                )}

                <div className="rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
                  
                  {/* HERO SECTION TRUE MOCKUP */}
                  {selectedPostKey === "hero" && (
                    <div className="relative overflow-hidden bg-gradient-to-b from-purple-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 space-y-4">
                      {currentForm.badge && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-300/40">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>{currentForm.badge}</span>
                        </div>
                      )}

                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white">
                        {currentForm.title || "Headline Title"}
                      </h2>

                      {currentForm.subtitle && (
                        <p className="text-xs sm:text-sm font-bold text-amber-300/90">
                          {currentForm.subtitle}
                        </p>
                      )}

                      <p className="text-xs text-purple-100/80 leading-relaxed whitespace-pre-wrap">
                        {currentForm.content_body || "Hero description body..."}
                      </p>

                      {currentForm.button_text && (
                        <div className="pt-2">
                          <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-purple-950 font-black text-xs rounded-xl shadow-lg">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{currentForm.button_text}</span>
                          </span>
                        </div>
                      )}

                      {currentForm.image_url && (
                        <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl mt-4">
                          <Image
                            src={currentForm.image_url}
                            alt="Hero Image"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10 text-[10px]">
                        <div>
                          <strong className="text-amber-300 font-mono block">100% Organic</strong>
                          <span className="text-purple-200/70">Verified farms</span>
                        </div>
                        <div>
                          <strong className="text-amber-300 font-mono block">Express POS</strong>
                          <span className="text-purple-200/70">Fast scans</span>
                        </div>
                        <div>
                          <strong className="text-amber-300 font-mono block">Ledger Sync</strong>
                          <span className="text-purple-200/70">Zero drift</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PROMOTIONAL FLASH DEAL TRUE MOCKUP */}
                  {selectedPostKey === "promo_banner" && (
                    <div className="bg-white p-6">
                      <div className="rounded-3xl overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white p-6 space-y-4 shadow-xl">
                        {currentForm.badge && (
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black bg-amber-400 text-purple-950 uppercase tracking-wider">
                            {currentForm.badge}
                          </span>
                        )}

                        <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                          {currentForm.title || "Promo Headline"}
                        </h3>

                        {currentForm.subtitle && (
                          <p className="text-xs font-bold text-amber-300">{currentForm.subtitle}</p>
                        )}

                        <p className="text-xs text-purple-100/90 leading-relaxed whitespace-pre-wrap">
                          {currentForm.content_body || "Promo description body..."}
                        </p>

                        {currentForm.image_url && (
                          <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-md">
                            <Image
                              src={currentForm.image_url}
                              alt="Promo Image"
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="object-cover"
                            />
                          </div>
                        )}

                        {currentForm.button_text && (
                          <div className="pt-2">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-950 font-black text-xs rounded-xl shadow-md">
                              <span>{currentForm.button_text}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ABOUT US TRUE MOCKUP */}
                  {selectedPostKey === "about" && (
                    <div className="bg-white p-6 space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-900">
                        <Store className="w-3 h-3 text-purple-700" />
                        <span>{currentForm.badge || "About Our Platform"}</span>
                      </div>

                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {currentForm.title || "About Title"}
                      </h3>

                      {currentForm.subtitle && (
                        <p className="text-xs font-bold text-amber-600">{currentForm.subtitle}</p>
                      )}

                      <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {currentForm.content_body || "About text details..."}
                      </div>

                      {currentForm.image_url && (
                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                          <Image
                            src={currentForm.image_url}
                            alt="About Image"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* CONTACT US TRUE MOCKUP */}
                  {selectedPostKey === "contact" && (
                    <div className="bg-slate-900 text-white p-6 space-y-4">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        Store Location &amp; Support Desk
                      </span>

                      <h3 className="text-xl font-black text-white">{currentForm.title || "Contact Title"}</h3>
                      <p className="text-xs text-purple-200">{currentForm.subtitle}</p>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{currentForm.content_body}</p>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-[11px]">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-400" />
                          <span>Solvexa Main Commercial Market, Pakistan</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-amber-400" />
                          <span>+92 300 1234567</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span>Open Daily: 8:00 AM - 11:00 PM</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CUSTOM POST TRUE STOREFRONT CARD MOCKUP */}
                  {!["hero", "promo_banner", "about", "contact"].includes(selectedPostKey) && (
                    <div className="bg-white p-6 space-y-4">
                      <div className="solvexa-card p-6 bg-slate-50 border-purple-100 space-y-3">
                        {currentForm.image_url && (
                          <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200">
                            <Image
                              src={currentForm.image_url}
                              alt="Card Image"
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="object-cover"
                            />
                          </div>
                        )}

                        {currentForm.badge && (
                          <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-full border border-amber-300">
                            {currentForm.badge}
                          </span>
                        )}

                        <h3 className="font-black text-base text-slate-900">{currentForm.title || "Post Title"}</h3>
                        {currentForm.subtitle && (
                          <p className="text-xs font-bold text-purple-700">{currentForm.subtitle}</p>
                        )}
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {currentForm.content_body || "Description..."}
                        </p>

                        {currentForm.button_text && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700">
                            <span>{currentForm.button_text}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200/80 text-xs text-purple-950 flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  <strong>100% Real-Time Rendering:</strong> What you see in this live mockup is identical to the live Public Home Screen. Changes are synchronized on save.
                </div>
              </div>

            </div>

          </div>
        )}

        {/* CREATE NEW POST MODAL */}
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
                      placeholder="e.g. eid_special_offer"
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
                  <label className="font-bold text-slate-700">Banner Image URL (HTTPS link)</label>
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
