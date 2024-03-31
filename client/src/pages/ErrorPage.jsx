import { Link } from "react-router-dom";
import NavBar from "../components/Navbar";
import popIcon from "../../public/bubblesicon.png";

export default function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-2xl">
      <Link to="/">
        <img
          className="flex justify-center text-center align-center mb-2"
          src={popIcon}
        ></img>
      </Link>

      <div className="text-center">
        {" "}
        <h1>Sorry. The page you are looking for was not found.</h1>
        <Link to="/">
          <h4 className="hover:bg-blue-300">Return Home</h4>
        </Link>
      </div>
    </div>
  );
}
