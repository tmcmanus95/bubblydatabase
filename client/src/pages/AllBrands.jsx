import { Link } from "react-router-dom";
import brandLogos from "../assets/brandLogos.json";
import BrandTile from "../components/BrandTile";
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
        <div className="brand-grid max-w-6xl mx-auto mt-14 mb-14">
          {brandLogos.map((brand) => (
            <BrandTile key={brand.name} brandName={brand.name} />
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
            className="ml-10  p-3 rounded-lg bg-blue-100 hover:bg-blue-300 text-black"
          >
            Contact
          </Link>
        </div>
      </div>
    </>
  );
}
