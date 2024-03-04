export function capitalizeFlavors(bubblyWater) {
  const capitalizedFlavors = [];
  console.log(
    "I am in the capitalize flavors util, here is my data",
    bubblyWater
  );
  for (let i = 0; i < bubblyWater.flavor.length; i++) {
    capitalizedFlavors.push(
      bubblyWater.flavor[i][0].toUpperCase() +
        bubblyWater.flavor[i].substring(1)
    );
  }
  return capitalizedFlavors;
}
