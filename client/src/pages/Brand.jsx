import { useQuery } from "@apollo/client";
import { QUERY_SINGLE_BRAND } from "../../utils/queries";
import { useParams } from "react-router-dom";
export default function Brand() {
  const { brandName } = useParams();
  console.log(brandName);
  const { data } = useQuery(QUERY_SINGLE_BRAND, { variables: { brandName } });
  console.log("here is my brand data", data);
  return (
    <>
      <h1>Welcome to the {brandName} page</h1>
    </>
  );
}
