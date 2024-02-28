import { useQuery } from "@apollo/client";
import { useState } from "react";
import { QUERY_SINGLE_FLAVOR } from "../../utils/queries";
import BubblyWaterList from "./BubblyWaterList";

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bubblyWater, setBubblyWater] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const inputValue = e.target.elements.searchInput.value;
    setSearchTerm(inputValue);
    console.log("Search Term:", searchTerm);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input name="searchInput"></input>
        <button type="submit">Search</button>
      </form>
      {searchTerm ? <BubblyWaterList searchTerm={searchTerm} /> : <></>}
    </div>
  );
}
