export function capitalizeSingleFlavor(flavor) {
  const capitalizedFlavor = flavor[0].toUpperCase() + flavor.substring(1);
  return capitalizedFlavor;
}
