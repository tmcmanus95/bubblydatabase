import { useQuery } from "@apollo/client";
import { QUERY_ALL_BUBBLYS } from "../../utils/queries";
import { Link } from "react-router-dom";
import { capitalizeFlavors } from "../../utils/capitalizeFlavors";
import { Rating } from "@mui/material";
export default function AllTime() {
  const { data, error } = useQuery(QUERY_ALL_BUBBLYS);
  let sortedBubblyWaters = [];
  let capitalizedFlavors = [];

  if (data && data.bubblyWaters) {
    sortedBubblyWaters = data.bubblyWaters
      .slice()
      .sort((a, b) => b.averageRating - a.averageRating);
    console.log("Sorted bubblyWaters:", sortedBubblyWaters);
  }
  if (data && data.bubblyWaters) {
    data.bubblyWaters.forEach((bubblyWater) => {
      const flavors = capitalizeFlavors(bubblyWater);
      capitalizedFlavors.push(flavors);
    });
  }
  console.log(sortedBubblyWaters);
  console.log(capitalizedFlavors);

  return (
    <>
      {sortedBubblyWaters.map((bubblyWater, index) => (
        <div key={index}>
          <section className="m-5">
            <Link to={`bubblyWater/${bubblyWater._id}`}>
              <div className="lg:flex gap-10">
                <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10 bg-white">
                  <h1>{index + 1}</h1>
                  <img
                    width={100}
                    height={100}
                    src={bubblyWater.imageURL}
                    className="mx-auto"
                  />
                  <h3 className="text-lg font-medium pt-8 pb-2">
                    {bubblyWater.brandName}
                  </h3>
                  <p className="py-2">{bubblyWater.productName}</p>
                  <h5>
                    Average rating: {bubblyWater.averageRating} / 5.0{" "}
                    <span>({bubblyWater.ratings.length})</span>
                  </h5>
                  <h4 className={capitalizedFlavors[index].join(" ")}>
                    Flavors: {capitalizedFlavors[index]}
                  </h4>
                  <Rating
                    readOnly
                    value={bubblyWater.averageRating}
                    precision={0.1}
                  />{" "}
                  <span></span>
                </div>
              </div>
            </Link>
          </section>
        </div>
      ))}
    </>
  );
}
