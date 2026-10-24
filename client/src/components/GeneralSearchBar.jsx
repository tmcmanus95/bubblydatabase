import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchUrl } from "../../utils/searchParams";
export default function GeneralSearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    // Enter (or the search key on phones) opens the search page with the term in the URL (P1-20)
    <form
      role="search"
      className="w-96 lg:w-96"
      onSubmit={(e) => {
        e.preventDefault();
        if (searchTerm.trim()) navigate(searchUrl({ q: searchTerm.trim() }));
      }}
    >
      <label
        htmlFor="default-search"
        className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
      >
        Search
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>
        <input
          type="search"
          id="default-search"
          className="block w-64 md:w-96 lg:w-96 p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg dark:text-white bg-gray-50 dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500"
          required
          placeholder="Search products, brands, users..."
          value={searchTerm}
          onChange={handleInputChange}
        />
        <button type="submit" className="sr-only">
          Search
        </button>
      </div>
    </form>
  );
}
