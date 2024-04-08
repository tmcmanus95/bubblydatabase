import { Link } from "react-router-dom";
import brandLogos from "../assets/brandLogos.json";
import { formatBrands } from "../../utils/formatBrands";
export default function AllBrands() {
  return (
    <>
      <section className="m-5 mt-20">
        <div>
          <h3 className="text-4xl py-1 flex justify-center">All Brands</h3>
        </div>
        {brandLogos.map((brand, index) => (
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
        ))}
      </section>
      <div>
        <p className="ml-10">
          Don't see a brand? Submit a missing brand using the contact method
          below.
        </p>
        <Link to="/contact">Contact</Link>
      </div>
    </>
  );
}
