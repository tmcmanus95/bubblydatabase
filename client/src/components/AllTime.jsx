import { useQuery } from "@apollo/client";
import { QUERY_ALL_BUBBLYS } from "../../utils/queries";
import { Link } from "react-router-dom";
import { capitalizeFlavors } from "../../utils/capitalizeFlavors";
import { Rating } from "@mui/material";
import BubblyWaterList from "./BubblyWaterList";
export default function AllTime() {
  const { data, error } = useQuery(QUERY_ALL_BUBBLYS);
  let sortedBubblyWaters = [];
  let capitalizedFlavors = [];

  if (data && data.bubblyWaters) {
    data.bubblyWaters.forEach((bubblyWater) => {
      const flavors = capitalizeFlavors(bubblyWater);
      capitalizedFlavors.push(flavors);
    });
  }
  console.log(sortedBubblyWaters);
  console.log(capitalizedFlavors);

  return (
    <>
      <h1 className="text-4xl flex justify-center m-5">
        Top Rated Bubbly Waters Of All Time
      </h1>
      <BubblyWaterList />
    </>
  );
}
