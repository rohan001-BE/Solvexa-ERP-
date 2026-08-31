import { createClient } from "@/lib/supabase/client";
import { Inventory, InventoryMovement, StockMovementDirection } from "@/types/database.types";

export const inventoryService = {
  async getInventory() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("inventory")
      .select("*, product:products(*, category:categories(*), unit:units(*))")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((inv: any) => ({
      ...inv,
      quantity_on_hand: inv.quantity,
    })) as Inventory[];
  },

  async getMovements(productId?: string) {
    const supabase = createClient();
    let query = supabase
      .from("inventory_movements")
      .select("*, product:products(name, sku), creator:profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((mov: any) => ({
      ...mov,
      direction: mov.type?.includes("OUT") || mov.type === "SALE" || mov.type === "PURCHASE_RETURN" ? "OUT" : "IN",
    })) as InventoryMovement[];
  },

  async adjustInventory(input: {
    product_id: string;
    quantity: number;
    direction: StockMovementDirection;
    note?: string;
  }) {
    return this.adjustStock(input.product_id, input.quantity, input.direction, input.note || "");
  },

  async adjustStock(productId: string, quantity: number, direction: StockMovementDirection, note: string) {
    const supabase = createClient();
    const { error } = await supabase.rpc("adjust_inventory", {
      p_product_id: productId,
      p_quantity: Number(quantity),
      p_direction: direction,
      p_note: note,
    });

    if (error) throw error;
  },
};
