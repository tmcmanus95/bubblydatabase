import { Link } from "react-router-dom";
import Auth from "../../utils/auth";
export default function NavBar() {
  const logout = (event) => {
    event.preventDefault();
    Auth.logout();
  };
  return (
    <div className="flex justify-between items-center bg-white p-4">
      <div className="flex items-center space-x-4">
        <Link to="/" className="font-semibold text-lg">
          Home
        </Link>
        <Link to="/allBrands">Brands</Link>
        <Link to="/allFlavors">Flavors</Link>
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
