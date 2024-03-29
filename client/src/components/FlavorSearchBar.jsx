import { useState } from "react";
import BubblyWaterList from "./BubblyWaterList";
import Logo from "./Logo";

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
  "Cinammon",
];

export default function FlavorSearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFlavor, setSelectedFlavor] = useState("");

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectFlavor = (flavor) => {
    setSelectedFlavor(flavor);
    setSearchTerm(flavor);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (filteredFlavors.length > 0) {
      handleSelectFlavor(filteredFlavors[0]);
    }
  };

  const filteredFlavors = flavors.filter((flavor) =>
    flavor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Logo />
      <div className="mt-5 px-2">
        <section className="text-center ">
          <form onSubmit={handleFormSubmit} className="relative">
            <div className="items-center">
              <input
                className="text-xl md:text-3xl mx-2 md:mx-5 border-2 border-gray-400 py-2 px-4 rounded"
                type="text"
                placeholder="Search for a flavor..."
                value={searchTerm}
                onChange={handleInputChange}
              />
              {searchTerm && (
                <ul className="absolute mt-1 bg-white border border-gray-300 rounded z-10 left-1/2 transform -translate-x-1/2 w-full md:w-80">
                  {filteredFlavors.map((flavor) => (
                    <li
                      key={flavor}
                      onClick={() => handleSelectFlavor(flavor)}
                      className={`${flavor} cursor-pointer py-2 px-4 hover:bg-gray-100`}
                    >
                      {flavor}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="submit"
              className="bg-blue-100 hover:bg-blue-200 font-bold py-2 px-4 rounded text-xl md:text-3xl mt-2"
            >
              Search
            </button>
          </form>
        </section>
        {selectedFlavor ? (
          <BubblyWaterList searchTerm={selectedFlavor.toLowerCase()} />
        ) : (
          <BubblyWaterList />
        )}
      </div>
    </>
  );
}
