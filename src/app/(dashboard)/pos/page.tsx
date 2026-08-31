"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { productsService } from "@/services/products.service";
import { customersService } from "@/services/customers.service";
import { salesService } from "@/services/sales.service";
import { Product, Customer } from "@/types/database.types";
import {
  MonitorSmartphone,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Loader2,
  X,
  AlertCircle,
  Receipt,
  Tag,
  PackageX,
  Printer,
  Sparkles,
  Barcode,
  RefreshCw,
  User,
  Phone,
  Store
} from "lucide-react";
import Image from "next/image";

interface CartItem extends Product {
  cartQuantity: number;
}

interface CompletedSaleDetails {
  invoiceNumber: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  changeDue: number;
  paymentMethod: string;
  timestamp: string;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  
  // Checkout Modal State
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "JAZZCASH" | "EASYPAISA">("CASH");
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{type: "success" | "error", message: string} | null>(null);
  
  // Receipt Modal State
  const [completedSale, setCompletedSale] = useState<CompletedSaleDetails | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, custs] = await Promise.all([
        productsService.getProducts(),
        customersService.getCustomers(),
      ]);
      setProducts(prods.filter(p => p.is_active));
      
      // Default to walk-in customer if exists
      const walkIn = custs.find(c => c.name.toLowerCase().includes("walk-in"));
      if (walkIn) setSelectedCustomer(walkIn.id);
      else if (custs.length > 0) setSelectedCustomer(custs[0].id);
      
      setCustomers(custs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category?.name).filter(Boolean));
    return Array.from(cats) as string[];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || 
                            p.name.toLowerCase().includes(q) || 
                            (p.barcode && p.barcode.toLowerCase().includes(q)) ||
                            (p.sku && p.sku.toLowerCase().includes(q));
      const matchesCategory = !selectedCategory || p.category?.name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  // Handle barcode quick scan (Enter key in search)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      e.preventDefault();
      const match = products.find(
        p => p.barcode?.toLowerCase() === search.toLowerCase().trim() ||
             p.sku?.toLowerCase() === search.toLowerCase().trim() ||
             p.name.toLowerCase() === search.toLowerCase().trim()
      );
      if (match) {
        addToCart(match);
        setSearch("");
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearch("");
      }
    }
  };

  // Cart Management
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map(item => {
      if (item.id === id) {
        const newQ = Math.max(1, item.cartQuantity + delta);
        return { ...item, cartQuantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.sale_price * item.cartQuantity, 0);
  const cartTax = cart.reduce((sum, item) => sum + (item.sale_price * item.cartQuantity * (item.tax_rate / 100)), 0);
  const cartTotal = cartSubtotal + cartTax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    setFeedback(null);

    const tendered = parseFloat(amountTendered) || 0;
    const paidAmount = paymentMethod === "CASH" ? Math.min(tendered > 0 ? tendered : cartTotal, cartTotal) : cartTotal;
    const changeDue = paymentMethod === "CASH" && tendered > cartTotal ? tendered - cartTotal : 0;

    try {
      const invoiceNumber = `POS-${Date.now().toString().slice(-6)}`;
      await salesService.createSale({
        customer_id: selectedCustomer || null,
        invoice_number: invoiceNumber,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.cartQuantity,
          unit_price: item.sale_price,
          tax: (item.sale_price * item.cartQuantity * (item.tax_rate / 100)),
          discount: 0
        })),
        paid_amount: paidAmount,
        payment_method: paymentMethod as any,
      });

      const customerObj = customers.find(c => c.id === selectedCustomer);
      
      setCompletedSale({
        invoiceNumber,
        customerName: customerObj?.name || "Walk-in Customer",
        items: [...cart],
        subtotal: cartSubtotal,
        tax: cartTax,
        total: cartTotal,
        paidAmount,
        changeDue,
        paymentMethod,
        timestamp: new Date().toLocaleString(),
      });

      setCart([]);
      setShowCheckout(false);
      setAmountTendered("");
      
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Checkout failed" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4 overflow-hidden -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-slate-100">
      
      {/* LEFT PANEL: PRODUCTS & CATALOG */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header & Barcode Search Bar */}
        <div className="p-4 border-b border-purple-100 space-y-3 bg-gradient-to-r from-purple-50/70 via-white to-amber-50/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-900 text-amber-300 flex items-center justify-center shadow-md shadow-purple-950/20">
                <MonitorSmartphone className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-black text-purple-950 flex items-center gap-1.5">
                  <span>Solvexa Point of Sale</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </h1>
                <p className="text-[11px] text-slate-500">Scan barcodes or tap products to instantly build checkout carts</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-purple-700 hover:border-purple-200 rounded-xl transition-all shadow-2xs"
                title="Refresh Products"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Scan barcode or type product name (Press Enter to auto-add)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-purple-200/80 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all font-medium placeholder:text-slate-400 shadow-2xs"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Categories Pill Navigation */}
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !selectedCategory
                  ? "bg-purple-900 text-amber-300 shadow-md shadow-purple-950/20"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-purple-50 hover:text-purple-900"
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map(cat => {
              const count = products.filter(p => p.category?.name === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-purple-900 text-amber-300 shadow-md shadow-purple-950/20"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-purple-50 hover:text-purple-900"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid Catalog */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin bg-slate-50/50">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="text-xs font-bold text-slate-500">Loading catalog items...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <PackageX className="w-12 h-12 mb-2 opacity-40 text-purple-400" />
              <p className="text-sm font-bold text-slate-700">No matching products found</p>
              <p className="text-xs text-slate-400 mt-1">Try another search keyword or clear the active category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map(product => {
                const inCart = cart.find(c => c.id === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`group relative bg-white border rounded-2xl p-3 text-left transition-all cursor-pointer flex flex-col active:scale-95 shadow-2xs hover:shadow-md ${
                      inCart
                        ? "border-purple-600 ring-2 ring-purple-600/10 bg-purple-50/10"
                        : "border-slate-200 hover:border-purple-300"
                    }`}
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 z-10 bg-purple-900 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full font-mono shadow-xs">
                        x{inCart.cartQuantity}
                      </span>
                    )}

                    <div className="w-full aspect-square rounded-xl bg-slate-50 mb-2.5 relative overflow-hidden border border-slate-100 flex items-center justify-center">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-contain p-1"
                        />
                      ) : (
                        <Tag className="w-8 h-8 text-slate-300 group-hover:text-purple-400 transition-colors" />
                      )}
                    </div>

                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider truncate mb-0.5">
                      {product.category?.name || "General"}
                    </span>

                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight mb-2 group-hover:text-purple-900">
                      {product.name}
                    </h3>

                    <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black text-purple-950 font-mono">
                        PKR {Number(product.sale_price).toLocaleString()}
                      </span>
                      <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs group-hover:bg-purple-900 group-hover:text-amber-300 transition-colors">
                        +
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: LIVE CART & TICKET */}
      <div className="w-full md:w-96 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-purple-900 bg-gradient-to-r from-purple-950 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Live POS Register</h2>
              <p className="text-[10px] text-purple-200/70">Current active checkout basket</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-purple-950 px-2.5 py-0.5 rounded-full text-xs font-mono font-black shadow-xs">
              {cart.reduce((s, i) => s + i.cartQuantity, 0)} items
            </span>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="p-1 text-purple-300 hover:text-rose-300 transition-colors"
                title="Clear Cart"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Customer Select Dropdown */}
        <div className="p-3 border-b border-slate-100 bg-purple-50/30 flex items-center gap-2">
          <User className="w-4 h-4 text-purple-700 flex-shrink-0" />
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="flex-1 bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-purple-600 shadow-2xs cursor-pointer"
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin bg-slate-50/30">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-400 flex items-center justify-center mb-3">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-700">POS Cart is Empty</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click catalog items or scan barcodes to begin a sale</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-2.5 bg-white border border-slate-200/80 p-2.5 rounded-2xl shadow-2xs hover:border-purple-300 transition-all">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    PKR {Number(item.sale_price).toLocaleString()} / unit
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1.5">
                  <div className="text-xs font-black text-purple-950 font-mono">
                    PKR {(item.sale_price * item.cartQuantity).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                    <button
                      onClick={() => item.cartQuantity === 1 ? removeFromCart(item.id) : updateQuantity(item.id, -1)}
                      className="p-1 hover:bg-white rounded text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      {item.cartQuantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    </button>
                    <span className="text-xs font-bold w-5 text-center font-mono">{item.cartQuantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 hover:bg-white rounded text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Calculation & Checkout Button */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-3">
          <div className="space-y-1.5 text-xs font-medium text-slate-600">
            <div className="flex justify-between">
              <span>Gross Items Subtotal</span>
              <span className="font-mono font-bold text-slate-900">PKR {cartSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax &amp; Surcharges</span>
              <span className="font-mono font-bold text-slate-900">PKR {cartTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
              <span className="text-purple-950">Net Payable</span>
              <span className="font-mono text-purple-800 font-black">PKR {cartTotal.toLocaleString()}</span>
            </div>
          </div>
          
          <button
            disabled={cart.length === 0}
            onClick={() => {
              setFeedback(null);
              setAmountTendered(cartTotal.toString());
              setShowCheckout(true);
            }}
            className="w-full py-3.5 bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-950/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Banknote className="w-4 h-4 text-amber-300" />
            <span>Process Payment (PKR {cartTotal.toLocaleString()})</span>
          </button>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-slate-200">
            <div className="p-4 border-b border-purple-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-700" />
                <h3 className="text-sm font-black text-purple-950">
                  Select Settlement Method
                </h3>
              </div>
              <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-center p-4 bg-gradient-to-br from-purple-900 to-indigo-950 rounded-2xl text-white shadow-inner">
                <p className="text-[11px] text-amber-300 font-bold uppercase tracking-wider mb-0.5">Total Amount Due</p>
                <p className="text-3xl font-black font-mono">PKR {cartTotal.toLocaleString()}</p>
              </div>

              {feedback && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{feedback.message}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Payment Gateway / Tender Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "CASH", icon: Banknote, label: "Cash" },
                    { id: "CARD", icon: CreditCard, label: "Debit/Credit Card" },
                    { id: "JAZZCASH", icon: Smartphone, label: "JazzCash" },
                    { id: "EASYPAISA", icon: Smartphone, label: "Easypaisa" }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                        paymentMethod === m.id
                          ? "border-purple-700 bg-purple-50 text-purple-950 font-black shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <m.icon className="w-4 h-4 text-purple-700" />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "CASH" && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Cash Received from Customer</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">PKR</span>
                    <input
                      type="number"
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value)}
                      placeholder={cartTotal.toString()}
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                    />
                  </div>
                  
                  {/* Quick currency denomination shortcuts */}
                  <div className="flex gap-1.5">
                    {[500, 1000, 5000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountTendered(amt.toString())}
                        className="flex-1 py-1 bg-slate-100 hover:bg-purple-100 text-slate-700 text-[11px] font-bold font-mono rounded-lg transition-colors cursor-pointer"
                      >
                        {amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAmountTendered(cartTotal.toString())}
                      className="flex-1 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 text-[11px] font-bold font-mono rounded-lg transition-colors cursor-pointer"
                    >
                      Exact
                    </button>
                  </div>

                  {parseFloat(amountTendered) > cartTotal && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-xs font-bold text-emerald-900">
                      <span>Change Due to Return:</span>
                      <span className="font-mono text-sm font-black">PKR {(parseFloat(amountTendered) - cartTotal).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2.5">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={processing}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Confirm &amp; Finalize</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED SALE RECEIPT MODAL */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-purple-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-black text-sm">Sale Completed Successfully</span>
              </div>
              <button onClick={() => setCompletedSale(null)} className="text-purple-200 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Slip Preview */}
            <div className="p-6 overflow-y-auto space-y-4 text-slate-800 text-xs font-mono bg-white">
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                <div className="font-black text-base text-purple-950 uppercase tracking-tight">Solxa Grocery Store</div>
                <div className="text-[10px] text-slate-500">Solxa Main Market, Pakistan</div>
                <div className="text-[10px] text-slate-500">Tel: +92 300 1234567</div>
                <div className="text-[10px] font-bold text-purple-900 mt-1">Invoice #: {completedSale.invoiceNumber}</div>
                <div className="text-[9px] text-slate-400">{completedSale.timestamp}</div>
              </div>

              <div className="text-[11px] pb-2 border-b border-dashed border-slate-300">
                <span className="text-slate-500">Customer:</span> <strong className="text-slate-900">{completedSale.customerName}</strong>
              </div>

              <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-300">
                {completedSale.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-[11px]">
                    <div className="truncate pr-2">
                      <span>{item.name}</span>
                      <span className="text-[10px] text-slate-500 block">x{item.cartQuantity} @ PKR {Number(item.sale_price).toLocaleString()}</span>
                    </div>
                    <span className="font-bold whitespace-nowrap">
                      PKR {(item.sale_price * item.cartQuantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>PKR {completedSale.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>PKR {completedSale.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-purple-950 pt-1 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span>PKR {completedSale.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Method:</span>
                  <span>{completedSale.paymentMethod}</span>
                </div>
                {completedSale.changeDue > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Change Returned:</span>
                    <span>PKR {completedSale.changeDue.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-400">
                Thank you for shopping at Solvexa Store!
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-950 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 bg-purple-900 hover:bg-purple-950 text-amber-300 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-md"
              >
                New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
