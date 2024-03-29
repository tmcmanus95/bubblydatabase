import { Link } from "react-router-dom";
export default function Logo() {
  const backgroundStyle = {
    backgroundImage:
      "url('https://media.self.com/photos/5ca6731e7184015a1cb71d59/4:3/w_2560%2Cc_limit/GettyImages-688558956_RT.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <>
      <div style={backgroundStyle}>
        <section className="text-center">
          <div className="p-5 md:p-10 bg-white ">
            <Link to="/">
              <h2 className="text-3xl md:text-6xl font-medium text-black">
                Pop.
              </h2>
            </Link>
            <h3 className="text-xl mt-5 md:text-3xl">
              Bubbly Water Rating Database
            </h3>
            <p className="text-sm md:text-xl  mt-5 leading-8 text-gray-800 max-w-xl mx-auto">
              Find the top rated carbonated waters by flavor or brand.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
