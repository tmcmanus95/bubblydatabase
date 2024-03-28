import { Link } from "react-router-dom";
export default function ErrorPage() {
  return (
    <div className="flex items-center">
      <h1>Sorry. The page you are looking for was not found.</h1>
      <Link to="/">
        <h4>Return Home</h4>
      </Link>
    </div>
  );
}
