import { Link } from "react-router-dom";
import { formatBrands } from "../../utils/formatBrands";
import { Rating } from "@mui/material";
export default function UsersReviews({ reviews }) {
  return (
    <>
      <section>
        <h3 className="text-2xl font-semibold">Recent Reviews</h3>
        <section>
          <ul className="p-5 flex-col flex items-center ">
            {reviews?.map((review, index) => (
              <li
                key={index}
                style={{ width: "500px" }}
                className="border-2 border-black"
              >
                <div className="rounded-t-lg p-2 flex items-center justify-between">
                  <img
                    className="w-10 h-20 object-cover rounded-full"
                    src={review.bubblyWater.imageURL}
                    alt={review.bubblyWater.productName}
                  />
                  <span>{review.bubblyWater.productName}</span>
                  <span>{formatBrands(review.bubblyWater.brandName)}</span>
                  <div class="text-yellow-400">
                    <Rating
                      readOnly
                      size="small"
                      value={review.rating}
                      precision={0.5}
                    />
                  </div>
                </div>
                <div class="mt-4">
                  <p class="text-gray-700 ml-2 text-left">
                    {review.reviewText}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </>
  );
}
