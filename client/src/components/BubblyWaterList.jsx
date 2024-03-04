import { useQuery } from "@apollo/client";
import { QUERY_SINGLE_FLAVOR } from "../../utils/queries";
import BubblyWaterListItem from "./BubblyWaterListItem";
export default function BubblyWaterList({ searchTerm }) {
  const { error, data } = useQuery(QUERY_SINGLE_FLAVOR, {
    variables: { flavor: searchTerm },
  });
  let sortedBubblyWaters = [];

  if (data && data.flavors) {
    sortedBubblyWaters = data.flavors
      .slice()
      .sort((a, b) => b.averageRating - a.averageRating);
  }
  return (
    <div>
      <div>
        <h3 className="text-4xl text-center py-1 mt-5 text-decoration-line: underline">
          Top Rated {searchTerm} Bubbly Waters
        </h3>
        <p className="text-md py-5 leading-8 text-gray-800"></p>
      </div>
      {sortedBubblyWaters.map((bubblyWater, index) => (
        <BubblyWaterListItem key={index} bubblyWater={bubblyWater} />
      ))}
    </div>
  );
}
