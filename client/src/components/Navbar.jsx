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
  };
  const logout = (event) => {
    event.preventDefault();
    Auth.logout();
  };
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 mx-auto px-4 md:flex items-center bg-slate-200 dark:bg-stone-900 gap-6 py-1">
      <div className="flex w-full items-center">
        <Link to="/">
          <img className="h-5 lg:h-10  mr-5" src="/bubblesicon.png"></img>{" "}
        </Link>
        <div className="md:hidden flex items-center ml-5 text-right">
          <GiHamburgerMenu
            onClick={toggleMenu}
            style={{ fontSize: "24px", cursor: "pointer" }}
          />
        </div>
        <div className="hidden md:gap-5 md:flex md:flex-row ">
          <Link
            to="/allBrands"
            className="hover:bg-blue-300 dark:hover:bg-slate-600 lg:p-2 rounded-lg"
          >
            Brands
          </Link>
          <Link
            to="/allFlavors"
            className="hover:bg-blue-300 dark:hover:bg-slate-600 lg:p-2 rounded-lg"
          >
            Flavors
          </Link>
          <Link
            to="/about"
            className="hover:bg-blue-300 dark:hover:bg-slate-600 lg:p-2 rounded-lg"
          >
            About
          </Link>
          <Link
            to="/contact"
            className="hover:bg-blue-300 dark:hover:bg-slate-600 lg:p-2 rounded-lg"
          >
            Contact
          </Link>
        </div>
        <div className="mx-5 flex justify-center align-center items-center">
          <GeneralSearchBar />
        </div>

        {menuOpen && (
          <div className="absolute inset-x-0 md:relative top-full md:top-auto md:left-auto md:flex bg-slate-200 flex-col items-center space-x-1 pb-3 md:pb-0 dark:bg-slate-900">
            <Link
              onClick={toggleMenu}
              to="/allBrands"
              className="py-2 px-3 block w-full hover:bg-blue-300 dark:hover:bg-slate-600"
            >
              Brands
            </Link>
            <Link
              onClick={toggleMenu}
              to="/allFlavors"
              className="py-2 px-3 block w-full hover:bg-blue-300 dark:hover:bg-slate-600"
            >
              Flavors
            </Link>
            <Link
              onClick={toggleMenu}
              to="/about"
              className="py-2 px-3 block w-full hover:bg-blue-300 dark:hover:bg-slate-600"
            >
              About
            </Link>
            <Link
              onClick={toggleMenu}
              to="/contact"
              className="py-2 px-3 block w-full hover:bg-blue-300 dark:hover:bg-slate-600"
            >
              Contact
            </Link>

            {Auth.loggedIn() ? (
              <>
                <Link
                  onClick={toggleMenu}
                  to="/me"
                  className="py-2 px-3 block w-full hover:bg-blue-300 dark:hover:bg-slate-600 "
                >
                  View My Profile
                </Link>
                <button
                  onClick={logout}
                  className="btn text-left py-2 px-3 block w-full hover:bg-blue-300 dark:hover:bg-slate-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="py-2 px-3 block w-full hover:bg-blue-300 dark:hover:bg-slate-600"
                  onClick={toggleMenu}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="py-2 px-3 block w-full hover:bg-blue-300 dark:hover:bg-slate-600"
                  onClick={toggleMenu}
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
              <button className="hover:bg-blue-300 dark:hover:bg-slate-600 p-2 rounded-lg">
                Profile
              </button>
            </Link>
            <button
              onClick={logout}
              className="hover:bg-blue-300 dark:hover:bg-slate-600 p-2 rounded-lg"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              <button className="hover:bg-blue-300 dark:hover:bg-slate-600 p-2 rounded-lg">
                Login
              </button>
            </Link>
            <Link to="/signup">
              <button className="hover:bg-blue-300 dark:hover:bg-slate-600 p-2 rounded-lg">
                Signup
              </button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
