import { useQuery } from "@apollo/client";
import { QUERY_SINGLE_BRAND, QUERY_MEID } from "../../utils/queries";
import { useParams } from "react-router-dom";
import Loading from "../components/Loading";
import { formatBrands } from "../../utils/formatBrands";
import brandLogos from "../assets/brandLogos.json";
import BubblyWaterListItem from "../components/BubblyWaterListItem";
import { Link } from "react-router-dom";
import BrandTile from "../components/BrandTile";
export default function Brand() {
  const { brandName } = useParams();
  let sortedBubblyWaters = [];
  let { data, loading } = useQuery(QUERY_SINGLE_BRAND, {
    variables: { brandName },
  });
  const { data: meIdData, error: meIdError } = useQuery(QUERY_MEID);
  let userId;
  let isVerified;
  if (meIdData) {
    userId = meIdData.meId._id;
    isVerified = meIdData.meId.isVerified;
    console.log("userId", userId);
  }

  console.log("here is my brand data", data);
  let bubblyWaters = [];
  if (data) {
    bubblyWaters = data.brand || [];
    sortedBubblyWaters = bubblyWaters
      .slice()
      .sort((a, b) => b.averageRating - a.averageRating);
  }
  const officialSite = brandLogos.find((brand) => brand.name === brandName)?.site || "";

  return (
    <>
      <div className="flex flex-col mt-16 items-center justify-center text-2xl">
        <BrandTile brandName={brandName} variant="hero" />
        {officialSite && (
          <p className="md:text-base text-xs text-center py-2 mt-5 font-bold">
            Bubbles. is not affiliated with {formatBrands(brandName)}. Visit their official site:{" "}
            <a href={officialSite} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
              {formatBrands(brandName)}
            </a>
          </p>
        )}
        <h2 className="lg:text-5xl text-xl text-center py-2 mt-5 font-bold">
          Top Rated <span>{formatBrands(brandName)}</span> Bubbly Waters
        </h2>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div>
          {sortedBubblyWaters.length > 0 ? (
            <>
              {sortedBubblyWaters.map((bubblyWater, index) => (
                <BubblyWaterListItem
                  key={index}
                  bubblyWater={bubblyWater}
                  ranking={index}
                  userId={userId}
                  isVerified={isVerified}
                />
              ))}
            </>
          ) : (
            <Loading />
          )}
        </div>
      )}
      <div>
        <p className="ml-10">
          Don't see a bubbly water? Submit a missing product using the contact
          method below.
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
