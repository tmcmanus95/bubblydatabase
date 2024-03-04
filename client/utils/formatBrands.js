export function formatBrands(brand) {
  let formattedName = brand
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return formattedName;
}
