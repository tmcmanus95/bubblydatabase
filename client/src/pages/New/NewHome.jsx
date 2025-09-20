import BubblyWaterList from "../../components/New/BubblyWaterList";
import { useQuery } from "@apollo/client";
import { QUERY_ALL_BUBBLYS } from "../../../utils/queries";
export default function NewHome() {
  const { loading, error, data } = useQuery(QUERY_ALL_BUBBLYS);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (data) {
    console.log("data", data[1]);
  }
  return (
    <div className="flex flex-col items-center">
      <h1 className="mt-14">Welcome to the Bubbly Database</h1>
      <BubblyWaterList bubblyWaters={data.bubblyWaters} />
    </div>
  );
}
