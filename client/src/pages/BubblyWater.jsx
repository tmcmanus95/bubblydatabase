import BasicRating from "../components/FiveStarRating";
import { QUERY_SINGLE_BUBBLYWATER } from "../../utils/queries";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
export default function BubblyWaterPage() {
  const { bubblyWaterId } = useParams();
  console.log(bubblyWaterId);
  const { data } = useQuery(QUERY_SINGLE_BUBBLYWATER, {
    variables: { bubblyWaterId },
  });
  console.log("data", data);
  const bubblyWater = data.bubblyWater;
  return (
    <>
      <h1>{bubblyWater.brandName}</h1>
      <h2>{bubblyWater.productName}</h2>
      <h3>Flavors:</h3>
      <h4>{bubblyWater.flavor}</h4>
      <BasicRating />
    </>
  );
}
