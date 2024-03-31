import { Link } from "react-router-dom";
export default function AllFlavors() {
  const flavors = [
    "Apple",
    "Apple-cider",
    "Apricot",
    "Berry",
    "Black-tea",
    "Blackberry",
    "Black-cherry",
    "Calamansi",
    "Chai",
    "Cherry",
    "Cinnamon",
    "Citrus",
    "Coconut",
    "Cola",
    "Cucumber",
    "Dragon-fruit",
    "Fruit-punch",
    "Ginger",
    "Grape",
    "Grapefruit",
    "Green-tea",
    "Guava",
    "Hibiscus",
    "Honey",
    "Kiwi",
    "Lemon",
    "Lemonade",
    "Lemon-sorbet",
    "Limoncello",
    "Lime",
    "Lychee",
    "Mandarin",
    "Mango",
    "Melon",
    "Mint",
    "Mojito",
    "Nectarine",
    "Orange",
    "Orange-cream",
    "Passionfruit",
    "Pear",
    "Pineapple",
    "Pink-lemonade",
    "Plain",
    "Plum",
    "Pomelo",
    "Raspberry",
    "Rose",
    "Strawberry",
    "Tea",
    "Watermelon",
  ];

  return (
    <div className="mt-10 justify-center flex flex-wrap gap-4 md:gap-6 lg:gap-10">
      {flavors.map((flavor, index) => (
        <Link key={index} to={`/flavors/${flavor.toLowerCase()}`}>
          <div
            className={`${flavor} w-28 md:w-36 lg:w-48 h-20 md:h-24 lg:h-32 rounded-md text-center hover:bg-blue-300 hover:text-black`}
          >
            <div className="flex items-center justify-center h-full p-2 md:p-3 lg:p-4">
              <h3 className="text-sm md:text-base lg:text-lg font-medium">
                {flavor}
              </h3>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
