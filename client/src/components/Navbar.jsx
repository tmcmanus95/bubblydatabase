import { Link } from "react-router-dom";
import { useState } from "react";
import Auth from "../../utils/auth";
import GeneralSearchBar from "./GeneralSearchBar";
import popIcon from "../../public/bubblesicon.png";
import { GiHamburgerMenu } from "react-icons/gi";

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    console.log("clicked, menuOpen is now:", menuOpen);
  };
  const logout = (event) => {
    event.preventDefault();
    Auth.logout();
  };
  return (
    <nav className="container mx-auto px-4 md:flex items-center gap-6 relative">
      <div className="flex items-center w-full">
        <Link to="/">
          <img className="height-10" src={popIcon}></img>{" "}
        </Link>
        <div className="md:hidden flex items-center absolute top-0 right-0">
          <GiHamburgerMenu onClick={toggleMenu} />
        </div>

        {menuOpen && (
          <div className="absolute inset-x-0 md:relative top-full md:top-auto md:left-auto md:flex flex-col items-center space-x-1 pb-3 md:pb-0 bg-red-500">
            <Link to="/allBrands" className="py-2 px-3 block w-full">
              Brands
            </Link>
            <Link to="/allFlavors" className="py-2 px-3 block w-full">
              Flavors
            </Link>
            <Link to="/about" className="py-2 px-3 block w-full">
              About
            </Link>
            {Auth.loggedIn() ? (
              <>
                <Link to="/me" className="py-2 px-3 block w-full">
                  View My Profile
                </Link>
                <button onClick={logout} className="btn py-2 px-3 block w-full">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="py-2 px-3 block w-full">
                  Login
                </Link>
                <Link to="/signup" className="py-2 px-3 block w-full">
                  Signup
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      <div className="hidden md:flex space-x-4">
        {Auth.loggedIn() ? (
          <>
            <Link to="/me">
              <button className="btn">View My Profile</button>
            </Link>
            <button onClick={logout} className="btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              <button className="btn">Login</button>
            </Link>
            <Link to="/signup">
              <button className="btn">Signup</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
