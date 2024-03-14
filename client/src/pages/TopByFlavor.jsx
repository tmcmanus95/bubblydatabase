import { useParams } from "react-router-dom";
import BubblyWaterList from "../components/BubblyWaterList";
import Logo from "../components/Logo";
export default function TopByFlavor() {
  const { flavor } = useParams();
  return (
    <>
      <Logo />
      <BubblyWaterList searchTerm={flavor} />;
    </>
  );
}
