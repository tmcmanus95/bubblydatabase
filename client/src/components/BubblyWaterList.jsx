import { useQuery } from "@apollo/client";
import { QUERY_SINGLE_FLAVOR } from "../../utils/queries";
import BubblyWaterListItem from "./BubblyWaterListItem";
export default function BubblyWaterList({ searchTerm }) {
  const { error, data } = useQuery(QUERY_SINGLE_FLAVOR, {
    variables: { flavor: searchTerm },
  });
  return (
    <div>
      {data?.flavors.map((bubblyWater, index) => (
        <BubblyWaterListItem key={index} bubblyWater={bubblyWater} />
      ))}
    </div>
  );
}
