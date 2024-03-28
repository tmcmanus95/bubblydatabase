import { useQuery } from "@apollo/client";
import { QUERY_SINGLE_BRAND } from "../../utils/queries";
import { useParams } from "react-router-dom";
import Loading from "../components/Loading";
import { formatBrands } from "../../utils/formatBrands";
import BubblyWaterListItem from "../components/BubblyWaterListItem";
export default function Brand() {
  const { brandName } = useParams();
  console.log(brandName);
  let sortedBubblyWaters = [];
  let { data, loading } = useQuery(QUERY_SINGLE_BRAND, {
    variables: { brandName },
  });
  console.log("here is my brand data", data);
  let bubblyWaters = [];
  if (data) {
    bubblyWaters = data.brand || [];
    sortedBubblyWaters = bubblyWaters
      .slice()
      .sort((a, b) => b.averageRating - a.averageRating);
  }
  const brandLogoLinks = {
    "la-croix":
      "https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/La_croix_%28logo%29.svg/800px-La_croix_%28logo%29.svg.png",
    bubly:
      "https://upload.wikimedia.org/wikipedia/commons/7/7b/Bubly_logo_2018.png",
    "sparkling-ice":
      "https://upload.wikimedia.org/wikipedia/commons/6/6c/SI_Logo_Purple_Soild_Bubbles.png",
    "san-pellegrino":
      "https://1000logos.net/wp-content/uploads/2020/09/S.-Pellegrino-Logo.jpg",
    perrier:
      "https://1000logos.net/wp-content/uploads/2020/07/Perrier-Logo.png",
    recess:
      "https://m.media-amazon.com/images/S/stores-image-uploads-na-prod/f/AmazonStores/ATVPDKIKX0DER/ee9aa8e178b8abfef64270b13637863d.w1920.h1080.png",
    sanzo: "https://pbs.twimg.com/media/FmN8T28WIBkEt4o.png",
    "polar-seltzer":
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Polar_Logo_2012.png/1200px-Polar_Logo_2012.png",
    "icelandic-glacial":
      "https://images.squarespace-cdn.com/content/v1/570c0ddb22482e2a4ab0f2d8/1544147928643-LBME68USKJM5RUQN4Z9J/header_3a.jpg",
    "good-&-gather":
      "https://images.squarespace-cdn.com/content/v1/5ef4b9a14215590dac8d9e26/f23f9c78-7993-47a1-9eaf-5c2aac767587/Untitled-2-01.jpg",
    kimino: "https://m.media-amazon.com/images/I/61QAISgfH9L.jpg",
    spindrift:
      "https://www.soulfirefarm.org/wp-content/uploads/2023/04/spindrift-logo-vector.png",
  };
  return (
    <>
      <div className="flex flex-col mt-5 items-center justify-center rounded-lg text-2xl border-2 border-black">
        <img
          src={brandLogoLinks[brandName]}
          width={400}
          height={200}
          className="rounded-lg"
        />
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
                />
              ))}
            </>
          ) : (
            <h1>No bubbly waters found</h1>
          )}
        </div>
      )}
    </>
  );
}
