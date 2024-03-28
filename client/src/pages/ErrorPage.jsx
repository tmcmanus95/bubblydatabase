import { Link } from "react-router-dom";
import NavBar from "../components/Navbar";

export default function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-2xl">
      <div className="text-center">
        <h1>Sorry. The page you are looking for was not found.</h1>
        <Link to="/">
          <h4 className="hover:bg-blue-300">Return Home</h4>
        </Link>
      </div>
    </div>
  );
}
