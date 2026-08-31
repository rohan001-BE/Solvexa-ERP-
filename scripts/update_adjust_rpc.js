const { Client } = require("pg");

const dbPassword = encodeURIComponent("IGI@001001@001");

async function updateAdjustInventoryRPC() {
  const pgClient = new Client({
    connectionString: `postgres://postgres:${dbPassword}@db.eptifegytprrzumltjce.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  await pgClient.query(`
    CREATE OR REPLACE FUNCTION public.adjust_inventory(
      p_product_id uuid,
      p_quantity numeric,
      p_direction text,
      p_note text DEFAULT ''
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      v_delta numeric;
      v_type movement_type;
    BEGIN
      IF p_direction = 'IN' THEN
        v_delta := abs(p_quantity);
        v_type := 'ADJUSTMENT_IN'::movement_type;
      ELSE
        v_delta := -1 * abs(p_quantity);
        v_type := 'ADJUSTMENT_OUT'::movement_type;
      END IF;

      INSERT INTO inventory (product_id, quantity, updated_at)
      VALUES (p_product_id, greatest(0, v_delta), now())
      ON CONFLICT (product_id)
      DO UPDATE SET
        quantity = greatest(0, inventory.quantity + v_delta),
        updated_at = now();

      INSERT INTO inventory_movements (
        product_id,
        type,
        quantity,
        note,
        reference_type,
        created_by
      )
      VALUES (
        p_product_id,
        v_type,
        v_delta,
        p_note,
        'adjustment',
        auth.uid()
      );
    END;
    $$;
  `);

  console.log("✅ Updated adjust_inventory RPC with explicit movement_type casting");
  await pgClient.end();
}

updateAdjustInventoryRPC().catch(console.error);
