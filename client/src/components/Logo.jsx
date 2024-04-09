import { Link } from "react-router-dom";
import blackBubbles from "../assets/blackbubbles.jpg";

export default function Logo() {
  const backgroundStyle = {
    backgroundImage: `url(${blackBubbles})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    minHeight: "10vh",
  };

  return (
    <>
      <div style={backgroundStyle}>
        <section className="text-center flex flex-col mt-14 ">
          <div className="p-5 md:p-10">
            <Link to="/" className="flex justify-center">
              <h2 className="text-3xl md:text-6xl font-medium items-center bg-white border-2 border-black rounded-lg justify-center p-3 lg:w:96 w-56 ">
                Pop.
              </h2>
            </Link>
            <div className="flex justify-center">
              <h3 className="text-xl mt-3 md:text-3xl bg-white rounded-lg border-2 border-black">
                Bubbly Water Rating Database
              </h3>
            </div>
            <div className="flex justify-center">
              <p className="text-xs md:text-xl  mt-3 leading-8 mx-auto bg-white p-2 rounded-lg border-2 border-black">
                Find the top rated carbonated waters by flavor or brand.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
