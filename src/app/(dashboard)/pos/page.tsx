"use client";

import { useState, useEffect, useMemo } from "react";
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
  PackageX
} from "lucide-react";
import Image from "next/image";

interface CartItem extends Product {
  cartQuantity: number;
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
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            (p.barcode && p.barcode.includes(search));
      const matchesCategory = !selectedCategory || p.category?.name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

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

  const cartSubtotal = cart.reduce((sum, item) => sum + item.sale_price * item.cartQuantity, 0);
  const cartTax = cart.reduce((sum, item) => sum + (item.sale_price * item.cartQuantity * (item.tax_rate / 100)), 0);
  const cartTotal = cartSubtotal + cartTax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    setFeedback(null);

    const tendered = parseFloat(amountTendered) || 0;
    const paidAmount = paymentMethod === "CASH" ? Math.min(tendered, cartTotal) : cartTotal;

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

      setFeedback({ type: "success", message: `Sale completed successfully! Invoice: ${invoiceNumber}` });
      setCart([]);
      setShowCheckout(false);
      setAmountTendered("");
      
      // Auto-clear success message
      setTimeout(() => setFeedback(null), 5000);
      
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Checkout failed" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4 overflow-hidden -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-slate-100">
      
      {/* LEFT PANEL: PRODUCTS */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-100 space-y-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-purple-950 flex items-center gap-2">
              <MonitorSmartphone className="w-6 h-6 text-purple-700" />
              Point of Sale
            </h1>
            {feedback && (
              <div className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 ${
                feedback.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
                {feedback.message}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                !selectedCategory ? "bg-purple-900 text-amber-300 shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === cat ? "bg-purple-900 text-amber-300 shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin bg-slate-50/50">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <PackageX className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm font-medium">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="group bg-white border border-slate-200 rounded-2xl p-3 text-left hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10 transition-all cursor-pointer flex flex-col active:scale-95"
                >
                  <div className="w-full aspect-square rounded-xl bg-slate-50 mb-3 relative overflow-hidden">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300 group-hover:text-purple-200 transition-colors">
                        <Tag className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight mb-1 group-hover:text-purple-700">
                    {product.name}
                  </h3>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="text-sm font-black text-purple-900 font-mono">
                      Rs {Number(product.sale_price).toLocaleString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: CART */}
      <div className="w-full md:w-96 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-slate-100 bg-purple-950 text-white flex items-center justify-between">
          <h2 className="text-sm font-black flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            Current Order
          </h2>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
            {cart.reduce((s, i) => s + i.cartQuantity, 0)} Items
          </span>
        </div>

        {/* Customer Select */}
        <div className="p-3 border-b border-slate-100 bg-slate-50">
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-purple-500 shadow-sm"
          >
            <option value="">Walk-in Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-wider">Cart is Empty</p>
              <p className="text-[10px]">Select products to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 bg-white border border-slate-100 p-2.5 rounded-2xl shadow-sm hover:border-slate-200 transition-colors">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Rs {Number(item.sale_price).toLocaleString()}</div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="text-xs font-black text-purple-900 font-mono">
                    Rs {(item.sale_price * item.cartQuantity).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-0.5 border border-slate-200">
                    <button onClick={() => item.cartQuantity === 1 ? removeFromCart(item.id) : updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded shadow-sm text-slate-600 hover:text-rose-600">
                      {item.cartQuantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    </button>
                    <span className="text-xs font-bold w-4 text-center font-mono">{item.cartQuantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded shadow-sm text-slate-600 hover:text-emerald-600">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Pay Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <div className="space-y-1.5 mb-4 text-xs font-medium text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono">Rs {cartSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span className="font-mono">Rs {cartTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200 mt-2">
              <span>Total</span>
              <span className="font-mono text-purple-700">Rs {cartTotal.toLocaleString()}</span>
            </div>
          </div>
          
          <button
            disabled={cart.length === 0}
            onClick={() => setShowCheckout(true)}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Banknote className="w-5 h-5" />
            Charge Rs {cartTotal.toLocaleString()}
          </button>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-600" />
                Complete Payment
              </h3>
              <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="text-center p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-1">Total Due</p>
                <p className="text-3xl font-black text-purple-950 font-mono">Rs {cartTotal.toLocaleString()}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "CASH", icon: Banknote, label: "Cash" },
                    { id: "CARD", icon: CreditCard, label: "Card" },
                    { id: "JAZZCASH", icon: Smartphone, label: "JazzCash" },
                    { id: "EASYPAISA", icon: Smartphone, label: "Easypaisa" }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                        paymentMethod === m.id ? "border-purple-600 bg-purple-50 text-purple-700" : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      <m.icon className="w-4 h-4" />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "CASH" && (
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Amount Tendered</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">Rs</span>
                    <input
                      type="number"
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value)}
                      placeholder={cartTotal.toString()}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  {/* Quick amounts */}
                  <div className="flex gap-2 mt-2">
                    {[500, 1000, 5000].map(amt => (
                      <button key={amt} onClick={() => setAmountTendered(amt.toString())} className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-mono rounded-lg">
                        +{amt}
                      </button>
                    ))}
                    <button onClick={() => setAmountTendered(cartTotal.toString())} className="flex-1 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-bold font-mono rounded-lg border border-purple-200">
                      Exact
                    </button>
                  </div>

                  {parseFloat(amountTendered) > cartTotal && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center text-sm font-bold">
                      <span className="text-emerald-700">Change Due:</span>
                      <span className="text-emerald-900 font-mono text-lg">Rs {(parseFloat(amountTendered) - cartTotal).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={processing || (paymentMethod === "CASH" && amountTendered !== "" && parseFloat(amountTendered) < cartTotal)}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
