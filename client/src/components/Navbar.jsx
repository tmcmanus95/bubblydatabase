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
    <nav className=" mx-auto px-4 md:flex items-center bg-gray-100 gap-6 relative">
      <div className="flex w-full items-center">
        <Link to="/">
          <img className="h-5 lg:h-10 mr-5" src={popIcon}></img>{" "}
        </Link>
        <div className="md:hidden flex items-center absolute top-4 right-4">
          <GiHamburgerMenu onClick={toggleMenu} />
        </div>
        <div className="hidden md:gap-5  md:flex md:flex-row">
          <Link to="/allBrands" className="hover:bg-blue-300 lg:p-2 rounded-lg">
            Brands
          </Link>
          <Link
            to="/allFlavors"
            className="hover:bg-blue-300 lg:p-2 rounded-lg"
          >
            Flavors
          </Link>
          <Link to="/about" className="hover:bg-blue-300 lg:p-2 rounded-lg">
            About
          </Link>
        </div>
        <div className="mx-5 flex justify-center align-center items-center">
          <GeneralSearchBar />
        </div>

        {menuOpen && (
          <div className="absolute inset-x-0 md:relative top-full md:top-auto md:left-auto md:flex flex-col items-center space-x-1 pb-3 md:pb-0 bg-blue-100">
            <Link
              to="/allBrands"
              className="py-2 px-3 block w-full hover:bg-blue-300"
            >
              Brands
            </Link>
            <Link
              to="/allFlavors"
              className="py-2 px-3 block w-full hover:bg-blue-300"
            >
              Flavors
            </Link>
            <Link
              to="/about"
              className="py-2 px-3 block w-full hover:bg-blue-300"
            >
              About
            </Link>
            {Auth.loggedIn() ? (
              <>
                <Link
                  to="/me"
                  className="py-2 px-3 block w-full hover:bg-blue-300 "
                >
                  View My Profile
                </Link>
                <button
                  onClick={logout}
                  className="btn text-left py-2 px-3 block w-full hover:bg-blue-300 "
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="py-2 px-3 block w-full hover:bg-blue-300 "
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="py-2 px-3 block w-full hover:bg-blue-300 "
                >
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
              <button className="hover:bg-blue-300 p-2 rounded-lg">
                Profile
              </button>
            </Link>
            <button
              onClick={logout}
              className="hover:bg-blue-300 p-2 rounded-lg"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              <button className="hover:bg-blue-300 p-2 rounded-lg">
                Login
              </button>
            </Link>
            <Link to="/signup">
              <button className="hover:bg-blue-300 p-2 rounded-lg">
                Signup
              </button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
