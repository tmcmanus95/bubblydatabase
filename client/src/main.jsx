import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import BubblyWater from "./pages/BubblyWater.jsx";
import Brand from "./pages/Brand.jsx";
import AllBrands from "./pages/AllBrands.jsx";
import TopByFlavor from "./pages/TopByFlavor.jsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AllFlavors from "./pages/AllFlavors.jsx";

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
        path: "flavors/:flavor",
        element: <TopByFlavor />,
      },
    ],
  },
]);
ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
