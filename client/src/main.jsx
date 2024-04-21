import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import BubblyWater from "./pages/BubblyWater.jsx";
import Brand from "./pages/Brand.jsx";
import AllBrands from "./pages/AllBrands.jsx";
import TopByFlavor from "./pages/TopByFlavor.jsx";
import Contact from "./pages/Contact.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import AllFlavors from "./pages/AllFlavors.jsx";
import About from "./pages/About.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import SpecificUserRatings from "./pages/SpecificUserRatings.jsx";
import BasicRating from "./components/FiveStarRating.jsx";
import AllCaffeinated from "./pages/AllCaffeinated.jsx";
import AllCBD from "./pages/AllCBD.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      {
        path: "/me",
        element: <Profile />,
      },
      {
        path: "/user/:userId",
        element: <Profile />,
      },
      {
        path: "/user/:userId/ratings/:rating",
        element: <SpecificUserRatings />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/signup",
        element: <Signup />,
      },
      {
        path: "/bubblyWater/:bubblyWaterId",
        element: <BubblyWater />,
      },
      {
        path: "brands/:brandName",
        element: <Brand />,
      },
      {
        path: "/allBrands",
        element: <AllBrands />,
      },
      {
        path: "/allFlavors",
        element: <AllFlavors />,
      },
      {
        path: "/allCaffeinated",
        element: <AllCaffeinated />,
      },
      {
        path: "/allCBD",
        element: <AllCBD />,
      },
      {
        path: "/about",
        element: <About />,
      },
      {
        path: "flavors/:flavor",
        element: <TopByFlavor />,
      },
      {
        path: "search/:searchTerm",
        element: <SearchResults />,
      },
      {
        path: "/contact",
        element: <Contact />,
      },

      {
        path: "/testingRatingComponent",
        element: <BasicRating />,
      },
      {
        path: "*",
        element: <ErrorPage />,
      },
    ],
    errorElement: <ErrorPage />,
  },
]);
ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
