import { useQuery } from "@apollo/client";
import { useState } from "react";
import { QUERY_SINGLE_FLAVOR } from "../../utils/queries";
import BubblyWaterList from "./BubblyWaterList";

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bubblyWater, setBubblyWater] = useState(null);
  const { data } = useQuery(QUERY_SINGLE_FLAVOR, {
    variables: { flavor: searchTerm },
  });
  console.log(data);
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    console.log("Search Term:", searchTerm);
  };

  return (
    <div>
      <input onChange={handleInputChange}></input>
      <button>Search</button>
      {data ? <BubblyWaterList data={data} /> : <></>}
    </div>
  );
}
