import { Link } from "react-router-dom";

export default function AllFlavors() {
  const flavors = [
    "Apple",
    "Lemon",
    "Lime",
    "Grapefruit",
    "Orange",
    "Honey",
    "Blood-orange",
    "Green-tea",
    "Tea",
    "Black-tea",
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
    "Cinammon",
  ];

  flavors.sort();

  return (
    <div className="mt-20 flex justify-center lg:flex gap-10 flex-wrap">
      {flavors.map((flavor, index) => (
        <Link key={index} to={`/flavors/${flavor.toLowerCase()}`}>
          <div className={`w-64 ${flavor} text-center hover:bg-yellow-300`}>
            <div className="p-5">
              <h3 className="text-lg font-medium">{flavor}</h3>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
