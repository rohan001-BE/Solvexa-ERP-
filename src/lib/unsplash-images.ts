/**
 * Unsplash High-Resolution Verified CDN Images for Supermarket & Grocery ERP
 */

export const GROCERY_IMAGE_PRESETS = [
  { name: "Dairy Milk", category: "Dairy & Eggs", url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80" },
  { name: "Farm Fresh Eggs", category: "Dairy & Eggs", url: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80" },
  { name: "Artisanal Cheese & Butter", category: "Dairy & Eggs", url: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&auto=format&fit=crop&q=80" },
  { name: "Red Crisp Apples", category: "Fruits & Vegetables", url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80" },
  { name: "Fresh Yellow Bananas", category: "Fruits & Vegetables", url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80" },
  { name: "Ripe Red Tomatoes", category: "Fruits & Vegetables", url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80" },
  { name: "Farm Potatoes", category: "Fruits & Vegetables", url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80" },
  { name: "Fresh Red Onions", category: "Fruits & Vegetables", url: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80" },
  { name: "Green Salad Veggies", category: "Fruits & Vegetables", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80" },
  { name: "Whole Wheat Bread", category: "Bakery & Snacks", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80" },
  { name: "Potato Chips & Crisps", category: "Bakery & Snacks", url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80" },
  { name: "Premium Basmati Rice", category: "Grains & Rice", url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80" },
  { name: "Pure Cooking Oil", category: "Grains & Rice", url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80" },
  { name: "Traditional Spices & Masala", category: "Grains & Rice", url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80" },
  { name: "Chai Tea & Leaf", category: "Beverages", url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80" },
  { name: "Roasted Coffee Beans", category: "Beverages", url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80" },
  { name: "Fresh Citrus Juice", category: "Beverages", url: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&auto=format&fit=crop&q=80" },
  { name: "Cleaning Detergent & Soap", category: "Personal Care & Cleaning", url: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80" },
  { name: "Fresh Chicken & Meat", category: "Meat & Poultry", url: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop&q=80" },
];

/**
 * Maps any grocery item name or category to an authentic Unsplash image
 */
export function getUnsplashGroceryImage(name?: string | null, category?: string | null): string {
  const q = (name || "").toLowerCase();
  const cat = (category || "").toLowerCase();

  if (q.includes("milk") || q.includes("dairy") || q.includes("yogurt") || q.includes("dahi")) {
    return "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("egg") || q.includes("anda")) {
    return "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("cheese") || q.includes("butter") || q.includes("makhan")) {
    return "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("apple") || q.includes("seb")) {
    return "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("banana") || q.includes("kela")) {
    return "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("tomato") || q.includes("tamatar")) {
    return "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("potato") || q.includes("aloo")) {
    return "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("onion") || q.includes("pyaz")) {
    return "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("bread") || q.includes("roti") || q.includes("bakery") || q.includes("bun") || q.includes("cake")) {
    return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("rice") || q.includes("chawal") || q.includes("basmati") || q.includes("flour") || q.includes("atta") || q.includes("grain")) {
    return "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("oil") || q.includes("ghee") || q.includes("tel") || q.includes("olive")) {
    return "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("tea") || q.includes("chai") || q.includes("patti")) {
    return "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("coffee") || q.includes("espresso") || q.includes("nescafe")) {
    return "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("juice") || q.includes("drink") || q.includes("soda") || q.includes("cola") || q.includes("pepsi") || q.includes("coke")) {
    return "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("chip") || q.includes("snack") || q.includes("biscuit") || q.includes("cookies") || q.includes("lays")) {
    return "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("soap") || q.includes("detergent") || q.includes("surf") || q.includes("clean") || q.includes("shampoo")) {
    return "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("chicken") || q.includes("meat") || q.includes("beef") || q.includes("mutton") || q.includes("fish")) {
    return "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop&q=80";
  }
  if (q.includes("spice") || q.includes("masala") || q.includes("salt") || q.includes("pepper") || q.includes("mirch")) {
    return "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80";
  }

  // Category fallback
  if (cat.includes("fruit") || cat.includes("veg")) {
    return "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80";
  }
  if (cat.includes("dairy")) {
    return "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80";
  }
  if (cat.includes("bakery")) {
    return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80";
  }

  // Standard Supermarket Grocery Item
  return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80";
}
