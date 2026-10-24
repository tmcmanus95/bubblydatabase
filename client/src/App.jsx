import "./App.css";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { Outlet } from "react-router-dom";
import Footer from "./components/Footer";
import NavBar from "./components/Navbar";
import Auth from "../utils/auth";
import ToastHost from "./components/Toast";
import { setApolloClient } from "../utils/myRatings";

Auth.upgradeLegacyToken();

const httpLink = createHttpLink({
  uri: "/graphql",
  credentials: "same-origin",
});

// Sessions ride on httpOnly cookies, which the browser sends with every same-origin request. Only an old
// stored token (from before cookie sessions) is still sent as a header, until it's been upgraded.
const authLink = setContext((_, { headers }) => {
  const token = Auth.legacyToken();
  return token ? { headers: { ...headers, authorization: `Bearer ${token}` } } : { headers };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
setApolloClient(client);

function App() {
  return (
    <ApolloProvider client={client}>
      <div style={{ maxWidth: "100%", overflowX: "hidden", height: "100%" }}>
        <NavBar />
        <Outlet />

        <Footer />
        <ToastHost />
      </div>
    </ApolloProvider>
  );
}

export default App;
