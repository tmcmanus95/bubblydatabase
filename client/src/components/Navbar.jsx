import { Link } from "react-router-dom";
import Auth from "../../utils/auth";
import GeneralSearchBar from "./GeneralSearchBar";
import popIcon from "../../public/bubblesicon.png";

export default function NavBar() {
  const logout = (event) => {
    event.preventDefault();
    Auth.logout();
  };
  return (
    <div className="flex justify-between items-center bg-blue-200 p-4">
      <div className="flex items-center space-x-4">
        <Link to="/" className="font-semibold text-lg">
          <img className="height-10" src={popIcon}></img>{" "}
        </Link>
        <Link to="/allBrands">Brands</Link>
        <Link to="/allFlavors">Flavors</Link>
        <Link to="/about">About</Link>
        <GeneralSearchBar />
      </div>

      {Auth.loggedIn() ? (
        <div className="flex space-x-4">
          <Link to="/me">
            <button className="btn">View My Profile</button>
          </Link>
          <button onClick={logout} className="btn">
            Logout
          </button>
        </div>
      ) : (
        <div className="flex space-x-4">
          <Link to="/login">
            <button className="btn">Login</button>
          </Link>
          <Link to="/signup">
            <button className="btn">Signup</button>
          </Link>
        </div>
      )}
    </div>
  );
}
