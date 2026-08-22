// Used only if the PHP API is unreachable (e.g. previewing the frontend
// before XAMPP + MySQL are set up). Mirrors backend/db/schema.sql seed data.
export const sampleCategories = [
  { id: 1, name_en: "Goat", name_np: "खसी", sort_order: 1 },
  { id: 2, name_en: "Buffalo", name_np: "भैंसी", sort_order: 2 },
  { id: 3, name_en: "Chicken", name_np: "कुखुरा", sort_order: 3 },
  { id: 4, name_en: "Fish", name_np: "माछा", sort_order: 4 },
  { id: 5, name_en: "Spices & Pantry", name_np: "मसला", sort_order: 5 },
  { id: 6, name_en: "Ready to Cook", name_np: "तयारी", sort_order: 6 },
];

export const sampleProducts = [
  { id: 1, category_id: 1, category_name_en: "Goat", category_name_np: "खसी", name_en: "Goat Curry Cut (Bone-in)", name_np: "खसीको मासु", description: "Fresh bone-in goat, cut for curry.", unit: "kg", price_per_unit: "149.00", is_featured: 1, is_halal: 1, in_stock: 1 },
  { id: 2, category_id: 1, category_name_en: "Goat", category_name_np: "खसी", name_en: "Goat Boti (Boneless)", name_np: "बोटी", description: "Boneless goat cubes.", unit: "kg", price_per_unit: "179.00", is_featured: 0, is_halal: 1, in_stock: 1 },
  { id: 3, category_id: 1, category_name_en: "Goat", category_name_np: "खसी", name_en: "Goat Liver & Offal", name_np: "खसीको भुँडी", description: "Mixed goat offal, cleaned.", unit: "kg", price_per_unit: "89.00", is_featured: 0, is_halal: 1, in_stock: 1 },
  { id: 4, category_id: 2, category_name_en: "Buffalo", category_name_np: "भैंसी", name_en: "Buffalo Curry Cut", name_np: "भैंसीको मासु", description: "Fresh buffalo, bone-in, curry cut.", unit: "kg", price_per_unit: "89.00", is_featured: 1, is_halal: 1, in_stock: 1 },
  { id: 5, category_id: 2, category_name_en: "Buffalo", category_name_np: "भैंसी", name_en: "Buffalo Mince", name_np: "किमा", description: "Freshly minced buffalo.", unit: "kg", price_per_unit: "95.00", is_featured: 0, is_halal: 1, in_stock: 1 },
  { id: 6, category_id: 3, category_name_en: "Chicken", category_name_np: "कुखुरा", name_en: "Whole Chicken", name_np: "कुखुराको मासु", description: "Whole chicken, cleaned, skin-on.", unit: "kg", price_per_unit: "45.00", is_featured: 1, is_halal: 1, in_stock: 1 },
  { id: 7, category_id: 3, category_name_en: "Chicken", category_name_np: "कुखुरा", name_en: "Chicken Curry Cut", name_np: null, description: "Cut into curry pieces, bone-in.", unit: "kg", price_per_unit: "49.00", is_featured: 0, is_halal: 1, in_stock: 1 },
  { id: 8, category_id: 5, category_name_en: "Spices & Pantry", category_name_np: "मसला", name_en: "Timur (Sichuan Pepper)", name_np: "टिमुर", description: "Whole Nepali timur, 100g pack.", unit: "pack", price_per_unit: "35.00", is_featured: 0, is_halal: 1, in_stock: 1 },
  { id: 9, category_id: 6, category_name_en: "Ready to Cook", category_name_np: "तयारी", name_en: "Marinated Sekuwa Skewers", name_np: "सेकुवा", description: "Ready-to-grill goat sekuwa, marinated in-house.", unit: "pack", price_per_unit: "65.00", is_featured: 1, is_halal: 1, in_stock: 1 },
];
