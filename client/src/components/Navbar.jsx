import { Link } from "react-router-dom";
import Auth from "../../utils/auth";
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
        <form class="max-w-md mx-auto">
          <label
            for="default-search"
            class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
          >
            Search
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <svg
                class="w-4 h-4 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>
            <input
              type="search"
              id="default-search"
              class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Search Mockups, Logos..."
              required
            />
            <button
              type="submit"
              class="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Search
            </button>
          </div>
        </form>
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
