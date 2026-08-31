"use client";

import React from "react";
import { Product } from "@/types/database.types";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

export interface InvoiceItemRow {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  line_total: number;
}

interface InvoiceLineItemsProps {
  type?: "SALE" | "PURCHASE";
  mode?: "sale" | "purchase" | "SALE" | "PURCHASE";
  products: Product[];
  items: InvoiceItemRow[];
  onChange: (items: InvoiceItemRow[]) => void;
  currency?: string;
}

export function InvoiceLineItems({
  type,
  mode,
  products,
  items,
  onChange,
  currency = "PKR",
}: InvoiceLineItemsProps) {
  const isSale = (type === "SALE" || mode === "sale" || mode === "SALE") ?? true;
  const priceLabel = isSale ? "Unit Price" : "Unit Cost";

  const calculateLineTotal = (item: InvoiceItemRow) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const discount = Number(item.discount) || 0;
    const taxRate = Number(item.tax_rate) || 0;

    const baseAmount = qty * price;
    const discountedAmount = Math.max(0, baseAmount - discount);
    const taxAmount = (discountedAmount * taxRate) / 100;
    return discountedAmount + taxAmount;
  };

  const handleAddItem = () => {
    const defaultProduct = products[0];
    if (!defaultProduct) return;

    const defaultPrice = isSale
      ? Number(defaultProduct.sale_price || 0)
      : Number(defaultProduct.purchase_price ?? defaultProduct.cost_price ?? 0);

    const newItem: InvoiceItemRow = {
      product_id: defaultProduct.id,
      quantity: 1,
      unit_price: defaultPrice,
      discount: 0,
      tax_rate: Number(defaultProduct.tax_rate || 0),
      line_total: defaultPrice,
    };

    newItem.line_total = calculateLineTotal(newItem);
    onChange([...items, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItemRow, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    if (field === "product_id") {
      const selectedProd = products.find((p) => p.id === value);
      if (selectedProd) {
        current.unit_price = isSale
          ? Number(selectedProd.sale_price || 0)
          : Number(selectedProd.purchase_price ?? selectedProd.cost_price ?? 0);
        current.tax_rate = Number(selectedProd.tax_rate || 0);
      }
    }

    current.line_total = calculateLineTotal(current);
    updated[index] = current;
    onChange(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Summary Totals
  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0),
    0
  );
  const totalDiscount = items.reduce((sum, it) => sum + Number(it.discount || 0), 0);
  const grandTotal = items.reduce((sum, it) => sum + Number(it.line_total || 0), 0);
  const totalTax = Math.max(0, grandTotal - (subtotal - totalDiscount));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
          <span>Invoice Line Items</span>
          <span className="text-slate-400 font-normal">({items.length} items)</span>
        </h4>
        <button
          type="button"
          onClick={handleAddItem}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-xl text-xs border border-purple-200 shadow-xs transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Line Item</span>
        </button>
      </div>

      <div className="solvexa-card overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/60 text-purple-950 font-bold uppercase tracking-wider border-b border-purple-100">
              <tr>
                <th className="px-4 py-3 min-w-[220px]">Product / Item</th>
                <th className="px-3 py-3 w-28 text-center">Quantity</th>
                <th className="px-3 py-3 w-32 text-right">{priceLabel}</th>
                <th className="px-3 py-3 w-24 text-right">Discount</th>
                <th className="px-3 py-3 w-20 text-center">Tax %</th>
                <th className="px-4 py-3 w-32 text-right">Line Total</th>
                <th className="px-2 py-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                    No items added yet. Click &quot;Add Line Item&quot; to build the invoice.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.product_id);
                  const currentStock = prod?.stock?.quantity_on_hand ?? 0;
                  const isStockInsufficient = isSale && Number(item.quantity) > currentStock;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5">
                        <select
                          value={item.product_id}
                          onChange={(e) => handleUpdateItem(idx, "product_id", e.target.value)}
                          className="w-full bg-white border border-slate-200 text-slate-900 font-medium rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-purple-600 shadow-2xs"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.sku ? `(${p.sku})` : ""}
                              {isSale ? ` — Stock: ${p.stock?.quantity_on_hand ?? 0}` : ""}
                            </option>
                          ))}
                        </select>
                        {isStockInsufficient && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-700 mt-1 font-semibold">
                            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                            <span>Warning: Stock on hand is only {currentStock}!</span>
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(idx, "quantity", Number(e.target.value))
                          }
                          className="w-full bg-white border border-slate-200 text-center font-bold text-slate-900 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-purple-600 shadow-2xs"
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleUpdateItem(idx, "unit_price", Number(e.target.value))
                          }
                          className="w-full bg-white border border-slate-200 text-right font-mono font-medium text-slate-900 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-purple-600 shadow-2xs"
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) =>
                            handleUpdateItem(idx, "discount", Number(e.target.value))
                          }
                          className="w-full bg-white border border-slate-200 text-right font-mono text-slate-900 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-purple-600 shadow-2xs"
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={item.tax_rate}
                          onChange={(e) =>
                            handleUpdateItem(idx, "tax_rate", Number(e.target.value))
                          }
                          className="w-full bg-white border border-slate-200 text-center font-mono text-slate-900 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-purple-600 shadow-2xs"
                        />
                      </td>

                      <td className="px-4 py-2.5 text-right font-mono font-black text-purple-950">
                        {currency} {item.line_total.toFixed(2)}
                      </td>

                      <td className="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary Calculation Footer */}
        {items.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50/50 to-amber-50/30 p-4 border-t border-purple-100 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-500 font-medium">
              * Line items automatically update live inventory and ledger accounts upon posting.
            </div>

            <div className="space-y-1.5 text-right min-w-[220px]">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono font-medium">
                    - {currency} {totalDiscount.toFixed(2)}
                  </span>
                </div>
              )}
              {totalTax > 0 && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Tax:</span>
                  <span className="font-mono font-medium">
                    + {currency} {totalTax.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-purple-950 pt-1.5 border-t border-purple-200">
                <span>Grand Total:</span>
                <span className="font-mono text-base font-black text-purple-950">
                  {currency} {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
