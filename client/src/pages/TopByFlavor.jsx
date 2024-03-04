import { useParams } from "react-router-dom";
import BubblyWaterList from "../components/BubblyWaterList";
export default function TopByFlavor() {
  const { flavor } = useParams();
  return <BubblyWaterList searchTerm={flavor} />;
}
