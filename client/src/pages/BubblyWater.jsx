import BasicRating from "../components/FiveStarRating";
import { QUERY_SINGLE_BUBBLYWATER } from "../../utils/queries";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import Rating from "@mui/material/Rating";

export default function BubblyWaterPage() {
  const { bubblyWaterId } = useParams();
  console.log("bublyWaterId ", bubblyWaterId);
  const { data } = useQuery(QUERY_SINGLE_BUBBLYWATER, {
    variables: { bubblyWaterId },
  });
  console.log("data", data);
  console.log("data.bubblyWater", data?.bubblyWater);
  const bubblyWater = data?.bubblyWater;
  return (
    <>
      {bubblyWater ? (
        <>
          <h1>{bubblyWater.brandName}</h1>
          <h2>{bubblyWater.productName}</h2>
          <h3>Flavors:</h3>
          <h4>{bubblyWater.flavor}</h4>
          <Rating precision={0.5} readOnly value={bubblyWater.averageRating} />
        </>
      ) : (
        <h1>Loading...</h1>
      )}
    </>
  );
}
