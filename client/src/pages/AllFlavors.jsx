import { Link } from "react-router-dom";
export default function AllFlavors() {
  const flavors = [
    "Apple",
    "Lemon",
    "Lime",
    "Grapefruit",
    "Orange",
    "Cinnamon",
    "Honey",
    "Blood-orange",
    "Green-tea",
    "Tea",
    "Black-tea",
    "Black-cherry",
    "Cherry",
    "Grape",
    "Lemonade",
    "Pink-lemonade",
    "Lemon-sorbet",
    "Pomelo",
    "Calamansi",
    "Ginger",
    "Cucumber",
    "Mint",
    "Limoncello",
    "Mango",
    "Pineapple",
    "Kiwi",
    "Passionfruit",
    "Dragon-fruit",
    "Pear",
    "Plum",
    "Plain",
    "Strawberry",
    "Blackberry",
    "Raspberry",
    "Berry",
    "Hibiscus",
    "Watermelon",
    "Coconut",
  ];

  flavors.sort();

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
