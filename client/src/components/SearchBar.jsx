import { useQuery } from "@apollo/client";
import { useState } from "react";
import { QUERY_SINGLE_FLAVOR } from "../../utils/queries";
import BubblyWaterList from "./BubblyWaterList";

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    const inputValue = e.target.elements.searchInput.value;
    setSearchTerm(inputValue);
    console.log("Search Term:", searchTerm);
  };

  return (
    <div>
      <section className="text-center ">
        <div className="p-5 md:p-10">
          <h2 className="text-3xl md:text-6xl font-medium text-black">Pop.</h2>
          <h3 className="text-xl mt-5 md:text-3xl">
            Bubbly Water Rating Database
          </h3>
          <p className="text-sm md:text-xl py-5 mt-5 leading-8 text-gray-800 max-w-xl mx-auto">
            Find the top rated carbonated waters by flavor or brand.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <input name="searchInput"></input>
          <button
            type="submit"
            class="bg-blue-100 hover:bg-blue-200 ml-5 font-bold py-2 px-4 rounded"
          >
            Search
          </button>
        </form>
      </section>
      {searchTerm ? <BubblyWaterList searchTerm={searchTerm} /> : <></>}
    </div>
  );
}
