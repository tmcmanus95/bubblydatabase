import { useParams } from "react-router-dom";
import BubblyWaterList from "../components/BubblyWaterList";
import Logo from "../components/Logo";
import FlavorSearchBar from "../components/FlavorSearchBar";
export default function TopByFlavor() {
  const { flavor } = useParams();
  return (
    <div className="mt-14">
      {/* <Logo /> */}
      <BubblyWaterList searchTerm={flavor} />
    </div>
  );
}
