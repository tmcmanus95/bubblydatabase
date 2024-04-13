import { Link } from "react-router-dom";
import brandLogos from "../assets/brandLogos.json";
import { formatBrands } from "../../utils/formatBrands";
export default function AllBrands() {
  return (
    <>
      <section className="m-5 mt-20">
        <div>
          <h3 className="text-4xl py-1 flex justify-center">All Brands</h3>
          <h6 className="text-sm py-1 flex justify-center">
            Bubbles. is not affiliated with any of the brands listed below.
          </h6>
        </div>
        <div className="mt-20 mb-14 justify-center flex flex-wrap gap-4 md:gap-6 lg:gap-10">
          {brandLogos.map((brand, index) => (
            <div>
              <Link to={`/brands/${brand.name}`}>
                <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
                  <img
                    src={`${brand.link}`}
                    width={100}
                    height={100}
                    className="mx-auto"
                  />
                  <h3 className="text-lg font-medium pt-8 pb-2">
                    {formatBrands(brand.name)}
                  </h3>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>
      <div>
        <p className="ml-10">
          Don't see a brand? Submit a missing brand using the contact method
          below.
        </p>
        <div className="my-3">
          <Link
            to="/contact"
            className="ml-10  p-3 rounded-lg bg-blue-100 hover:bg-blue-300"
          >
            Contact
          </Link>
        </div>
      </div>
    </>
  );
}
