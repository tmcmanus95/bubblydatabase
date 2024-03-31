import { Link } from "react-router-dom";
import { formatBrands } from "../../utils/formatBrands";
import { Rating } from "@mui/material";
import { capitalizeSingleFlavor } from "../../utils/capitalizeSingleFlavor";
export default function UsersReviews({ reviews }) {
  return (
    <>
      <section>
        <h3 className="m-5 flex justify-center">Recent Reviews</h3>
        <section>
          <ul className="p-5 flex-col flex items-center">
            {reviews?.map((review, index) => (
              <Link to={`/bubblyWater/${review.bubblyWater._id}`} key={index}>
                <li className="border-2 w-64 md:w-96 bg-white mb-3 rounded-lg lg:text-l text-sm overflow-hidden">
                  <div
                    className={`${
                      review?.bubblyWater?.flavor[0]
                        ? `${capitalizeSingleFlavor(
                            review.bubblyWater.flavor[0]
                          )}-brushings rounded-t-lg p-2 flex gap-3 items-center justify-between`
                        : ""
                    }`}
                  >
                    <img
                      className="w-10 h-20 object-cover rounded-full flex-shrink-0"
                      src={review.bubblyWater.imageURL}
                      alt={review.bubblyWater.productName}
                    />
                    <div className="flex flex-col flex-grow">
                      <span className="overflow-hidden overflow-ellipsis">
                        {review.bubblyWater.productName}
                      </span>
                      <span className="overflow-hidden overflow-ellipsis">
                        {formatBrands(review.bubblyWater.brandName)}
                      </span>
                    </div>
                    <div>
                      <Rating
                        readOnly
                        size="small"
                        value={review.rating}
                        precision={0.5}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-700 ml-2 text-left overflow-hidden overflow-ellipsis">
                      {review.reviewText}
                    </p>
                  </div>
                </li>
              </Link>
            ))}
          </ul>
        </section>
      </section>
    </>
  );
}
