import { useQuery } from "@apollo/client";
import { QUERY_SINGLE_BRAND, QUERY_MEID } from "../../utils/queries";
import { useParams } from "react-router-dom";
import Loading from "../components/Loading";
import { formatBrands } from "../../utils/formatBrands";
import brandLogos from "../assets/brandLogos.json";
import BubblyWaterListItem from "../components/BubblyWaterListItem";
import { Link } from "react-router-dom";
export default function Brand() {
  const { brandName } = useParams();
  console.log(brandName);
  let sortedBubblyWaters = [];
  let { data, loading } = useQuery(QUERY_SINGLE_BRAND, {
    variables: { brandName },
  });
  const { data: meIdData, error: meIdError } = useQuery(QUERY_MEID);
  let userId;
  if (meIdData) {
    userId = meIdData.meId._id;
    console.log("userId", userId);
  }

  console.log("here is my brand data", data);
  let bubblyWaters = [];
  let logoLink = "";
  let officialSite = "";
  if (data) {
    bubblyWaters = data.brand || [];
    sortedBubblyWaters = bubblyWaters
      .slice()
      .sort((a, b) => b.averageRating - a.averageRating);
  }
  for (let i = 0; i < brandLogos.length; i++) {
    if (brandLogos[i].name == brandName) {
      logoLink = brandLogos[i].link;
    }
  }
  for (let i = 0; i < brandLogos.length; i++) {
    if (brandLogos[i].name == brandName) {
      officialSite = brandLogos[i].site;
    }
  }

  return (
    <>
      <div className="flex flex-col mt-16 items-center justify-center rounded-lg text-2xl border-2 border-black">
        <Link to={officialSite}>
          <img src={logoLink} width={400} height={200} className="rounded-lg" />
        </Link>
        <h3 className="md:text-m text-xs text-center py-2 mt-5 font-bold">
          Bubbles. is not affiliated with {formatBrands(brandName)}. Visit their
          official site here:
          <Link
            to={officialSite}
            onClick={() => handleOpenInNewTab(officialSite)}
          >
            <span className="text-blue-400"> {formatBrands(brandName)}</span>
          </Link>
        </h3>
        <h3 className="lg:text-5xl text-xl text-center py-2 mt-5 font-bold">
          <span>
            Top Rated <span>{formatBrands(brandName)}</span> Bubbly Waters
          </span>
        </h3>
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
