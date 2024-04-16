import { useParams } from "react-router-dom";
import BubblyWaterList from "../components/BubblyWaterList";
import Logo from "../components/Logo";
import FlavorSearchBar from "../components/FlavorSearchBar";
export default function TopByFlavor() {
  const { flavor } = useParams();
  return (
    <>
      {/* <Logo /> */}
      <BubblyWaterList searchTerm={flavor} />;
    </>
  );
}
