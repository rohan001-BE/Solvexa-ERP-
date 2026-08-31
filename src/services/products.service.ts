import { createClient } from "@/lib/supabase/client";
import { Product, Category, Unit } from "@/types/database.types";
import { getUnsplashGroceryImage } from "@/lib/unsplash-images";

export const productsService = {
  async getProducts() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), unit:units(*), inventory(*)")
      .order("name", { ascending: true });

    if (error) throw error;

    const list = (data || []) as Product[];
    return list.map((p) => ({
      ...p,
      image_url: p.image_url || getUnsplashGroceryImage(p.name, p.category?.name),
    }));
  },

  async getCategories() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []) as Category[];
  },

  async getUnits() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("units")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []) as Unit[];
  },

  async createProduct(productData: Partial<Product>, initialStock: number = 0) {
    const supabase = createClient();
    const purchasePrice = Number(productData.purchase_price ?? productData.cost_price ?? 0);
    const minStock = Number(productData.minimum_stock ?? productData.min_stock_level ?? 0);

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name: productData.name,
        sku: productData.sku || null,
        barcode: productData.barcode || null,
        category_id: productData.category_id || null,
        unit_id: productData.unit_id || null,
        brand: productData.brand || null,
        purchase_price: purchasePrice,
        sale_price: Number(productData.sale_price || 0),
        tax_rate: Number(productData.tax_rate || 0),
        minimum_stock: minStock,
        image_url: productData.image_url || null,
        is_active: productData.is_active !== false,
      })
      .select()
      .single();

    if (error) throw error;

    // Create initial inventory row
    if (product) {
      await supabase.from("inventory").insert({
        product_id: product.id,
        quantity: initialStock,
        minimum_stock: minStock,
      });

      if (initialStock > 0) {
        await supabase.from("inventory_movements").insert({
          product_id: product.id,
          type: "OPENING_STOCK",
          quantity: initialStock,
          note: "Opening stock balance",
        });
      }
    }

    return product as Product;
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    const supabase = createClient();
    const purchasePrice = Number(updates.purchase_price ?? updates.cost_price ?? 0);
    const minStock = Number(updates.minimum_stock ?? updates.min_stock_level ?? 0);

    const { data, error } = await supabase
      .from("products")
      .update({
        name: updates.name,
        sku: updates.sku || null,
        barcode: updates.barcode || null,
        category_id: updates.category_id || null,
        unit_id: updates.unit_id || null,
        brand: updates.brand || null,
        purchase_price: purchasePrice,
        sale_price: Number(updates.sale_price || 0),
        tax_rate: Number(updates.tax_rate || 0),
        minimum_stock: minStock,
        image_url: updates.image_url || null,
        is_active: updates.is_active !== undefined ? updates.is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  async createCategory(inputOrName: { name: string; description?: string } | string, description?: string) {
    const supabase = createClient();
    const name = typeof inputOrName === "string" ? inputOrName : inputOrName.name;
    const desc = typeof inputOrName === "string" ? description : inputOrName.description;

    const { data, error } = await supabase
      .from("categories")
      .insert({ name, description: desc || null })
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  async createUnit(inputOrName: { name: string; symbol: string } | string, symbol?: string) {
    const supabase = createClient();
    const name = typeof inputOrName === "string" ? inputOrName : inputOrName.name;
    const sym = typeof inputOrName === "string" ? symbol! : inputOrName.symbol;

    const { data, error } = await supabase
      .from("units")
      .insert({ name, symbol: sym })
      .select()
      .single();

    if (error) throw error;
    return data as Unit;
  },
};
