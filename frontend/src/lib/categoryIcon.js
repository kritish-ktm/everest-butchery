// Maps a category/product name to an Icon name (see components/Icon.jsx)
export function categoryIcon(categoryNameEn = "") {
  const n = categoryNameEn.toLowerCase();
  if (n.includes("goat")) return "goat";
  if (n.includes("buffalo")) return "buffalo";
  if (n.includes("chicken")) return "chicken";
  if (n.includes("fish")) return "fish";
  if (n.includes("spice") || n.includes("pantry")) return "spice";
  if (n.includes("ready")) return "skewer";
  return "meat";
}