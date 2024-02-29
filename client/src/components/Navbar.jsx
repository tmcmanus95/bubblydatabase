import { Link } from "react-router-dom";
import Auth from "../../utils/auth";
export default function NavBar() {
  const logout = (event) => {
    event.preventDefault();
    Auth.logout();
  };
  return (
    <>
      <Link to="/">
        <h2>Home</h2>
      </Link>
      {Auth.loggedIn() ? (
        <>
          <Link to="/me">
            <button class="btn">View My Profile</button>
          </Link>
          <button onClick={logout} class="btn">
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
    </>
  );
}
