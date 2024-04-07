import { useState } from "react";
import BubblyWaterList from "./BubblyWaterList";
import Logo from "./Logo";
import flavors from "../assets/flavors";

export default function FlavorSearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFlavor, setSelectedFlavor] = useState("");
  const [searchAll, setSearchAll] = useState(false);
  const [caffeineSearch, setCaffeineSearch] = useState(false);
  const [CBDSearch, setCBDSearch] = useState(false);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectFlavor = (flavor) => {
    setSelectedFlavor(flavor);
    setSearchTerm("");
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (filteredFlavors.length > 0) {
      handleSelectFlavor(filteredFlavors[0]);
    }
  };
  const toggleCBDSearch = () => {
    if (caffeineSearch == true) {
      setCaffeineSearch(false);
    }
    setCBDSearch(true);
  };
  const toggleCaffeineSearch = () => {
    if (CBDSearch == true) {
      setCBDSearch(false);
    }
    setCaffeineSearch(true);
  };
  const toggleSearchAll = () => {
    if (CBDSearch == true) {
      setCBDSearch(false);
    } else if (caffeineSearch == true) {
      setCaffeineSearch(false);
    }
    setSearchAll(true);
  };

  const filteredFlavors = flavors.filter((flavor) =>
    flavor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Logo />
      <div className="px-2 mt-2 ">
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
              <div className="flex justify-center">
                <div className="flex items-center py-3">
                  <div className="flex items-center mr-2">
                    <input
                      id="default-radio-1"
                      type="radio"
                      value=""
                      onClick={toggleSearchAll}
                      name="default-radio"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label
                      htmlFor="default-radio-1"
                      className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                    >
                      All
                    </label>
                  </div>
                  <div className="flex items-center mr-2">
                    <input
                      id="default-radio-2"
                      type="radio"
                      value=""
                      onClick={toggleCBDSearch}
                      name="default-radio"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label
                      htmlFor="default-radio-2"
                      className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                    >
                      CBD
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="default-radio-3"
                      type="radio"
                      value=""
                      onClick={toggleCaffeineSearch}
                      name="default-radio"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label
                      htmlFor="default-radio-2"
                      className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                    >
                      Caffeine
                    </label>
                  </div>
                </div>
              </div>

              {searchTerm && (
                <ul className="absolute mt-1 bg-white border border-gray-300 rounded z-10 left-1/2 transform -translate-x-1/2 w-full md:w-80">
                  {filteredFlavors.map((flavor) => (
                    <li
                      key={flavor}
                      onClick={() => handleSelectFlavor(flavor)}
                      className={`${flavor} cursor-pointer py-2 px-4 hover:bg-blue-300 hover:text-black`}
                    >
                      {flavor}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </form>
        </section>
        {selectedFlavor ? (
          <BubblyWaterList
            searchTerm={selectedFlavor.toLowerCase()}
            caffeineSearch={caffeineSearch}
            CBDSearch={CBDSearch}
          />
        ) : (
          <BubblyWaterList
            caffeineSearch={caffeineSearch}
            CBDSearch={CBDSearch}
          />
        )}
      </div>
    </>
  );
}
