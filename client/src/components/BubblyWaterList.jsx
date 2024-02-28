import { useQuery } from "@apollo/client";
import { QUERY_SINGLE_FLAVOR } from "../../utils/queries";
import BubblyWaterListItem from "./BubblyWaterListItem";
import BasicRating from "./FiveStarRating";
export default function BubblyWaterList({ searchTerm }) {
  console.log("I am in the bubblywaterlist, ", searchTerm);
  const { data } = useQuery(QUERY_SINGLE_FLAVOR, {
    variables: { flavor: searchTerm },
  });
  console.log("bubbly waters, ", data);

  return (
    <div>
      {data?.flavors.map((bubblyWater, index) => (
        <BubblyWaterListItem key={index} bubblyWater={bubblyWater} />
      ))}
    </div>
  );
}
