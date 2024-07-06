import { Link } from "react-router-dom";
import blackBubbles from "../assets/blackbubbles.jpg";
import whiteBubbles from "../assets/whitebubbles.jpg";

export default function Logo() {
  let backgroundStyle;
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    backgroundStyle = {
      backgroundImage: `url(${whiteBubbles})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "10vh",
    };
  } else {
    backgroundStyle = {
      backgroundImage: `url(${blackBubbles})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "10vh",
    };
  }

  return (
    <>
      <div style={backgroundStyle}>
        <section className="text-center flex flex-col mt-14">
          <div className="p-5 md:p-10">
            <Link to="/" className="flex justify-center">
              <h2 className="text-3xl md:text-6xl font-medium items-center bg-white dark:bg-black border-2 border-black dark:border-white rounded-lg justify-center p-3 lg:w:96 w-64 ">
                Bubbles.
              </h2>
            </Link>
            <div className="flex justify-center">
              <h3 className="text-l mt-3 md:text-3xl bg-white dark:bg-black rounded-lg border-2 dark:border-white border-black p-2">
                Bubbly Water Rating Database
              </h3>
            </div>
            <div className="flex justify-center">
              <p className="hidden text-xs md:text-xl mt-3 leading-8 mx-auto bg-white p-2 rounded-lg border-2 border-black">
                Find the top rated carbonated waters by flavor or brand.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
