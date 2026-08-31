import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getPublicCMSPosts } from "@/app/actions/cms";
import { DEFAULT_CMS_POSTS, CMSContent } from "@/lib/cms-constants";
import { getUnsplashGroceryImage } from "@/lib/unsplash-images";
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Mail,
  Tag,
  Store,
  Boxes,
  MonitorSmartphone,
  ChevronRight,
  UserCheck,
  Star
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  // Check auth status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch dynamic CMS Posts
  const cmsPosts = await getPublicCMSPosts();

  // Fetch sample products to showcase on the home page
  const { data: productsData } = await supabase
    .from("products")
    .select("*, category:categories(*), unit:units(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  const products = (productsData || []).map((p: any) => ({
    ...p,
    image_url: p.image_url || getUnsplashGroceryImage(p.name, p.category?.name),
  }));

  // Categorize CMS posts with typed fallbacks
  const heroPost = cmsPosts.find((p) => p.section_key === "hero") || DEFAULT_CMS_POSTS[0];
  const promoPost = cmsPosts.find((p) => p.section_key === "promo_banner") || DEFAULT_CMS_POSTS[1];
  const featurePost = cmsPosts.find((p) => p.section_key === "feature_fresh") || DEFAULT_CMS_POSTS[2];
  const aboutPost = cmsPosts.find((p) => p.section_key === "about") || DEFAULT_CMS_POSTS[3];
  const contactPost = cmsPosts.find((p) => p.section_key === "contact") || DEFAULT_CMS_POSTS[4];

  // Other custom CMS posts created by admin
  const otherPosts = cmsPosts.filter(
    (p) => !["hero", "promo_banner", "feature_fresh", "about", "contact"].includes(p.section_key)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-purple-700 selection:text-white">
      {/* 1. PUBLIC TOPBAR & BRAND HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-white border border-purple-200 shadow-sm flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="Solvexa Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-purple-950 tracking-tight text-lg flex items-center gap-1">
                <span>Solvexa</span>
                <span className="text-amber-600 font-black">Store</span>
              </span>
              <span className="text-[10px] text-purple-700 font-bold tracking-widest uppercase font-mono">
                Supermarket &amp; Grocery ERP
              </span>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-700">
            <a href="#hero" className="hover:text-purple-900 transition-colors">Home</a>
            <a href="#deals" className="hover:text-purple-900 transition-colors">Special Deals</a>
            <a href="#catalog" className="hover:text-purple-900 transition-colors">Product Showcase</a>
            <a href="#about" className="hover:text-purple-900 transition-colors">About Us</a>
            <a href="#contact" className="hover:text-purple-900 transition-colors">Store Info</a>
          </nav>

          {/* User Auth Action Button */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 text-white text-xs font-black rounded-xl shadow-md shadow-purple-900/25 transition-all hover:scale-[1.02]"
              >
                <Store className="w-4 h-4 text-amber-300" />
                <span>Go to Back-Office ERP</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-900 hover:bg-purple-950 text-amber-300 text-xs font-black rounded-xl shadow-md shadow-purple-950/20 transition-all hover:scale-[1.02]"
              >
                <UserCheck className="w-4 h-4" />
                <span>Staff &amp; Admin Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. DYNAMIC HERO SECTION (FROM CMS) */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-purple-950 via-indigo-950 to-slate-900 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {heroPost.badge && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-300/40 backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{heroPost.badge}</span>
                </div>
              )}

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                {heroPost.title}
              </h1>

              {heroPost.subtitle && (
                <p className="text-base sm:text-lg text-amber-300/90 font-bold">
                  {heroPost.subtitle}
                </p>
              )}

              <p className="text-sm sm:text-base text-purple-100/80 leading-relaxed max-w-2xl mx-auto lg:mx-0 whitespace-pre-wrap">
                {heroPost.content_body}
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  href={heroPost.button_url || "/products"}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-purple-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{heroPost.button_text || "Explore Products"}</span>
                </Link>

                <Link
                  href="/pos"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm rounded-2xl backdrop-blur-sm transition-all"
                >
                  <MonitorSmartphone className="w-4 h-4 text-amber-300" />
                  <span>Express POS Register</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10 text-left">
                <div className="space-y-0.5">
                  <div className="text-lg font-black text-amber-300 font-mono">100% Organic</div>
                  <div className="text-[11px] text-purple-200/70">Verified local farms</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-lg font-black text-amber-300 font-mono">Express Checkout</div>
                  <div className="text-[11px] text-purple-200/70">Sub-second barcode scans</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-lg font-black text-amber-300 font-mono">Atomic Ledgers</div>
                  <div className="text-[11px] text-purple-200/70">Zero drift bookkeeping</div>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 group">
                  <Image
                    src={heroPost.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80"}
                    alt="Solvexa Grocery Produce"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-700/90 text-amber-300 px-2.5 py-1 rounded-full font-mono">
                      Daily Fresh Stock
                    </span>
                    <h3 className="text-base font-black">Farm Crisp Fruits &amp; Vegetables</h3>
                    <p className="text-xs text-slate-200">Delivered early every morning</p>
                  </div>
                </div>

                {/* Ambient Blur Glows */}
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. DYNAMIC PROMOTIONAL FLASH DEAL BANNER (FROM CMS) */}
      {promoPost && promoPost.is_active !== false && (
        <section id="deals" className="py-12 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white shadow-xl p-8 sm:p-12">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                <div className="md:col-span-8 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-purple-950 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{promoPost.badge || "Limited Time Offer"}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{promoPost.title}</h2>
                  <p className="text-sm text-amber-300 font-bold">{promoPost.subtitle}</p>
                  <p className="text-xs text-purple-100/90 leading-relaxed max-w-xl whitespace-pre-wrap">
                    {promoPost.content_body}
                  </p>
                  <div className="pt-2">
                    <Link
                      href={promoPost.button_url || "/products"}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-950 hover:bg-amber-400 font-black text-xs rounded-xl shadow-md transition-all"
                    >
                      <span>{promoPost.button_text || "Shop Flash Deals"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {promoPost.image_url && (
                  <div className="md:col-span-4 relative aspect-video md:aspect-square rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg">
                    <Image
                      src={promoPost.image_url}
                      alt={promoPost.title || "Promo Deal"}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. LIVE PRODUCT SHOWCASE (REAL DATABASE ITEMS WITH INTERNET IMAGES) */}
      <section id="catalog" className="py-16 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black text-purple-700 uppercase tracking-wider mb-1">
                <Boxes className="w-4 h-4 text-purple-700" />
                <span>Featured Catalog</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Fresh Items &amp; Daily Grocery Essentials
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Live inventory synced in real-time from our central ERP stock register
              </p>
            </div>

            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-xs font-black text-purple-700 hover:text-purple-900 hover:underline"
            >
              <span>View All Products in ERP</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
              <Boxes className="w-12 h-12 mx-auto mb-2 opacity-40 text-purple-400" />
              <p className="text-sm font-bold text-slate-700">No products registered yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Add products with internet images from the Products page</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-xl hover:border-purple-300 transition-all flex flex-col group"
                >
                  <div className="relative aspect-square bg-slate-50 overflow-hidden flex items-center justify-center p-3 border-b border-slate-100">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Tag className="w-12 h-12 text-slate-300 group-hover:text-purple-400 transition-colors" />
                    )}
                    <span className="absolute top-3 left-3 bg-purple-900/90 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono backdrop-blur-xs">
                      {product.category?.name || "General"}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 group-hover:text-purple-900 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        SKU: {product.sku || "N/A"} • Unit: {product.unit?.symbol || "pcs"}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Retail Price</span>
                        <span className="text-base font-black text-purple-950 font-mono">
                          PKR {Number(product.sale_price).toLocaleString()}
                        </span>
                      </div>

                      <Link
                        href="/pos"
                        className="p-2 rounded-xl bg-purple-50 text-purple-800 hover:bg-purple-900 hover:text-amber-300 transition-colors"
                        title="Add to POS Cart"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. DYNAMIC CUSTOM CMS POSTS (IF ANY ADDITIONAL POSTS CREATED BY ADMIN) */}
      {otherPosts.length > 0 && (
        <section className="py-12 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-black text-purple-700 uppercase tracking-wider">Store Announcements</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Latest Updates from Solvexa</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherPosts.map((post) => (
                <div key={post.id} className="solvexa-card p-6 bg-slate-50 border-purple-100 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    {post.image_url && (
                      <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200">
                        <Image
                          src={post.image_url}
                          alt={post.title || "Post"}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    {post.badge && (
                      <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-full border border-amber-300">
                        {post.badge}
                      </span>
                    )}
                    <h3 className="font-black text-base text-slate-900">{post.title}</h3>
                    {post.subtitle && <p className="text-xs font-bold text-purple-700">{post.subtitle}</p>}
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{post.content_body}</p>
                  </div>

                  {post.button_text && (
                    <Link
                      href={post.button_url || "/products"}
                      className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline pt-2"
                    >
                      <span>{post.button_text}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. ABOUT & MISSION SECTION (FROM CMS) */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-900">
                <Store className="w-3.5 h-3.5 text-purple-700" />
                <span>{aboutPost.badge || "About Our Platform"}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {aboutPost.title}
              </h2>
              <p className="text-sm font-bold text-amber-600">
                {aboutPost.subtitle}
              </p>
              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap space-y-3">
                {aboutPost.content_body}
              </div>

              <div className="pt-2 flex items-center gap-4">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-900 hover:bg-purple-950 text-amber-300 text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  <span>Read Full Brand Story</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-purple-50 border border-purple-100 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-900 text-amber-300 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Role-Based Access</h4>
                  <p className="text-xs text-slate-500">Fine-grained permission matrices isolate staff, cashier, and manager operations.</p>
                </div>

                <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-purple-950 flex items-center justify-center font-bold">
                    <MonitorSmartphone className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Integrated POS</h4>
                  <p className="text-xs text-slate-500">High-speed barcode scanning register with instant thermal receipt generation.</p>
                </div>

                <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Double-Entry Ledger</h4>
                  <p className="text-xs text-slate-500">Atomic database transactions update accounts payable and receivable simultaneously.</p>
                </div>

                <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Live CMS Control</h4>
                  <p className="text-xs text-slate-500">Admin dashboard to manage promotions, banners, and storefront text in real-time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CONTACT & STORE INFO SECTION (FROM CMS) */}
      <section id="contact" className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Store Location &amp; Support</span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{contactPost.title}</h2>
              <p className="text-xs text-purple-200">{contactPost.subtitle}</p>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-w-xl">
                {contactPost.content_body}
              </p>
            </div>

            <div className="lg:col-span-5 bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>Solvexa Supermarket, Main Commercial Market, Pakistan</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>+92 300 1234567 / +92 42 35789012</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>support@solvexastore.com / billing@solvexastore.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>Open Daily: 8:00 AM - 11:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-8 border-t border-white/10 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Solvexa Store ERP</span>
            <span>• Enterprise Grocery &amp; POS Management Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white transition-colors">Staff Login</Link>
            <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link href="/pos" className="hover:text-white transition-colors">POS Terminal</Link>
            <Link href="/dashboard" className="text-amber-400 font-bold hover:underline">Admin Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
