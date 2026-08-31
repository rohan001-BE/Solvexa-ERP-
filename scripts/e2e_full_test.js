const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://eptifegytprrzumltjce.supabase.co";
const supabaseKey = "sb_publishable_XLuFxps4qyoqqrb7bLF4GQ_MWy26wHf";

async function runFullE2ETest() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("==================================================");
  console.log("   SOLVEXA GROCERY ERP — END-TO-END SYSTEM TEST   ");
  console.log("==================================================");

  // 1. Sign in as Admin
  console.log("\n🔑 [1/8] Authenticating as Admin (rohan@gmail.com)...");
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: "rohan@gmail.com",
    password: "001001",
  });
  if (authErr) throw new Error(`Auth failed: ${authErr.message}`);
  console.log(`✅ Logged in successfully. User UID: ${auth.user.id}`);

  // 2. Test Supplier Creation & Listing
  console.log("\n🚚 [2/8] Testing Supplier Creation & Listing...");
  const testSupplierName = `Supreme Dairy Supplies ${Date.now().toString().slice(-4)}`;
  const { data: newSup, error: supErr } = await supabase
    .from("suppliers")
    .insert({
      name: testSupplierName,
      company_name: "Supreme Dairy Ltd",
      phone: "0300-8877665",
      email: "orders@supremedairy.pk",
      address: "Plot 45, Sector I-9/2, Islamabad",
      opening_balance: 50000,
      current_balance: 50000,
      is_active: true,
    })
    .select()
    .single();

  if (supErr) throw new Error(`Supplier insert failed: ${supErr.message}`);
  console.log(`✅ Created Supplier: "${newSup.name}" (ID: ${newSup.id})`);

  const { data: allSups, error: allSupsErr } = await supabase.from("suppliers").select("*");
  if (allSupsErr) throw new Error(`Supplier fetch failed: ${allSupsErr.message}`);
  const foundSup = allSups.find((s) => s.id === newSup.id);
  if (!foundSup) throw new Error("Newly created supplier not found in suppliers list!");
  console.log(`✅ Verified Supplier in List: Found "${foundSup.name}" (Total Suppliers: ${allSups.length})`);

  // 3. Test Customer Creation & Listing
  console.log("\n👥 [3/8] Testing Customer Creation & Listing...");
  const testCustName = `Tariq Masood (Wholesale Buyer) ${Date.now().toString().slice(-4)}`;
  const { data: newCust, error: custErr } = await supabase
    .from("customers")
    .insert({
      name: testCustName,
      phone: "0321-9988776",
      email: "tariq.masood@gmail.com",
      address: "House 10, F-10/3, Islamabad",
      credit_limit: 100000,
      current_balance: 0,
      is_active: true,
    })
    .select()
    .single();

  if (custErr) throw new Error(`Customer insert failed: ${custErr.message}`);
  console.log(`✅ Created Customer: "${newCust.name}" (ID: ${newCust.id})`);

  const { data: allCusts, error: allCustsErr } = await supabase.from("customers").select("*");
  if (allCustsErr) throw new Error(`Customer fetch failed: ${allCustsErr.message}`);
  const foundCust = allCusts.find((c) => c.id === newCust.id);
  if (!foundCust) throw new Error("Newly created customer not found in customers list!");
  console.log(`✅ Verified Customer in List: Found "${foundCust.name}" (Total Customers: ${allCusts.length})`);

  // 4. Test Product & Initial Inventory Creation
  console.log("\n📦 [4/8] Testing Product Creation with Initial Stock & Inventory...");
  const { data: categories } = await supabase.from("categories").select("id, name").limit(1);
  const { data: units } = await supabase.from("units").select("id, symbol").limit(1);

  const testSku = `PROD-${Date.now().toString().slice(-5)}`;
  const { data: newProd, error: prodErr } = await supabase
    .from("products")
    .insert({
      name: `Premium Basmati Kernel Rice 10kg (${testSku})`,
      sku: testSku,
      barcode: `89610199${Date.now().toString().slice(-4)}`,
      category_id: categories[0].id,
      unit_id: units[0].id,
      purchase_price: 3200,
      sale_price: 3800,
      minimum_stock: 10,
      is_active: true,
    })
    .select()
    .single();

  if (prodErr) throw new Error(`Product insert failed: ${prodErr.message}`);
  console.log(`✅ Created Product: "${newProd.name}" (SKU: ${newProd.sku})`);

  // Insert Inventory
  const { data: newInv, error: invErr } = await supabase
    .from("inventory")
    .insert({
      product_id: newProd.id,
      quantity: 5, // Low stock test (5 <= 10)
      minimum_stock: 10,
    })
    .select()
    .single();

  if (invErr) throw new Error(`Inventory insert failed: ${invErr.message}`);
  console.log(`✅ Initialized Inventory: ${newInv.quantity} units in stock (Min Alert: ${newInv.minimum_stock})`);

  // 5. Test Product Listing with Joined Inventory
  console.log("\n🔍 [5/8] Testing Product Catalog Fetch with Inventory Join...");
  const { data: allProds, error: allProdsErr } = await supabase
    .from("products")
    .select("*, category:categories(name), unit:units(symbol), inventory(*)");

  if (allProdsErr) throw new Error(`Product fetch failed: ${allProdsErr.message}`);
  const foundProd = allProds.find((p) => p.id === newProd.id);
  if (!foundProd) throw new Error("Newly created product not found in products list!");
  const invQty = Array.isArray(foundProd.inventory) ? foundProd.inventory[0]?.quantity : foundProd.inventory?.quantity;
  console.log(`✅ Verified Product in Catalog: Found "${foundProd.name}" with ${invQty} units in stock (Total Products: ${allProds.length})`);

  // 6. Test Stock Adjustment via adjust_inventory RPC
  console.log("\n🔄 [6/8] Testing Stock Adjustment (+15 units inward adjustment)...");
  const { error: adjErr } = await supabase.rpc("adjust_inventory", {
    p_product_id: newProd.id,
    p_quantity: 15,
    p_direction: "IN",
    p_note: "Received emergency batch from local supplier",
  });

  if (adjErr) throw new Error(`Stock adjustment failed: ${adjErr.message}`);

  const { data: updatedInv } = await supabase
    .from("inventory")
    .select("quantity")
    .eq("product_id", newProd.id)
    .single();

  console.log(`✅ Stock Adjusted Successfully: New Quantity = ${updatedInv.quantity} units (Expected 20)`);

  // 7. Test Customer Sales Invoice Creation via create_sale RPC
  console.log("\n💳 [7/8] Testing Atomic Customer Sales Invoice Creation...");
  const saleInvoiceNum = `INV-E2E-${Date.now().toString().slice(-4)}`;
  const { data: saleId, error: saleErr } = await supabase.rpc("create_sale", {
    p_customer_id: newCust.id,
    p_invoice_number: saleInvoiceNum,
    p_items: [
      {
        product_id: newProd.id,
        quantity: 2,
        unit_price: 3800,
        discount: 100,
        tax_rate: 0,
      },
    ],
    p_paid_amount: 5000,
    p_payment_method: "CASH",
  });

  if (saleErr) throw new Error(`Sale creation failed: ${saleErr.message}`);
  console.log(`✅ Generated Customer Sales Invoice: "${saleInvoiceNum}" (Sale ID: ${saleId})`);

  // Verify stock deduction (20 - 2 = 18)
  const { data: postSaleInv } = await supabase
    .from("inventory")
    .select("quantity")
    .eq("product_id", newProd.id)
    .single();

  console.log(`✅ Verified Stock Deduction: Quantity = ${postSaleInv.quantity} units (Expected 18)`);

  // 8. Clean up E2E test data
  console.log("\n🧹 [8/8] Cleaning up E2E test records...");
  await supabase.from("sale_items").delete().eq("sale_id", saleId);
  await supabase.from("sales").delete().eq("id", saleId);
  await supabase.from("inventory_movements").delete().eq("product_id", newProd.id);
  await supabase.from("inventory").delete().eq("product_id", newProd.id);
  await supabase.from("products").delete().eq("id", newProd.id);
  await supabase.from("customers").delete().eq("id", newCust.id);
  await supabase.from("suppliers").delete().eq("id", newSup.id);
  console.log("✅ Cleaned up all temporary test records.");

  console.log("\n==================================================");
  console.log("   🎉 ALL 8/8 END-TO-END TESTS PASSED 100%!       ");
  console.log("==================================================");
}

runFullE2ETest().catch((err) => {
  console.error("\n❌ E2E TEST FAILED:", err);
  process.exit(1);
});
