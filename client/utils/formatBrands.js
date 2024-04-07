export function formatBrands(brand) {
  if (
    brand == "bubly" ||
    brand == "aprch" ||
    brand == "wildwonder" ||
    brand == "present"
  ) {
    return brand;
  } else {
    let formattedName = brand
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return formattedName;
  }
}
