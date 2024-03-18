import { useQuery } from "@apollo/client";
import { QUERY_SINGLE_BRAND } from "../../utils/queries";
import { useParams } from "react-router-dom";
import BubblyWaterListItem from "../components/BubblyWaterListItem";
export default function Brand() {
  const { brandName } = useParams();
  console.log(brandName);
  let sortedBubblyWaters = [];
  let { data, loading } = useQuery(QUERY_SINGLE_BRAND, {
    variables: { brandName },
  });
  console.log("here is my brand data", data);
  let bubblyWaters = [];
  if (data) {
    bubblyWaters = data.brand || [];
    sortedBubblyWaters = bubblyWaters
      .slice()
      .sort((a, b) => b.averageRating - a.averageRating);
  }
  console.log("sorted bubbly waters, ", sortedBubblyWaters);
  return (
    <>
      <h1>Welcome to the {brandName} page</h1>
      {loading ? (
        <h1>Loading...</h1>
      ) : (
        <div>
          {sortedBubblyWaters.length > 0 ? (
            <>
              {sortedBubblyWaters.map((bubblyWater, index) => (
                <BubblyWaterListItem key={index} bubblyWater={bubblyWater} />
              ))}
            </>
          ) : (
            <h1>No bubbly waters found</h1>
          )}
        </div>
      )}
    </>
  );
}
