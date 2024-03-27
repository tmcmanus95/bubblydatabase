import { Link } from "react-router-dom";
import { formatBrands } from "../../utils/formatBrands";
import { Rating } from "@mui/material";
export default function UsersReviews({ reviews }) {
  return (
    <>
      <section>
        <h3 className="m-5 flex justify-center">Recent Reviews</h3>
        <section>
          <ul className="p-5 flex-col flex items-center ">
            {reviews?.map((review, index) => (
              <Link>
                <li
                  key={index}
                  style={{ width: "500px" }}
                  className="border-2 bg-white mb-3 rounded-lg"
                >
                  <div className="rounded-t-lg p-2 bg-blue-300 flex items-center justify-between">
                    <Link to={`/bubblyWater/${review.bubblyWater._id}`}>
                      <img
                        className="w-10 h-20 object-cover rounded-full"
                        src={review.bubblyWater.imageURL}
                        alt={review.bubblyWater.productName}
                      />
                    </Link>
                    <Link to={`/bubblyWater/${review.bubblyWater._id}`}>
                      <span>{review.bubblyWater.productName}</span>
                    </Link>
                    <Link to={`/brands/${review.bubblyWater.brandName}`}>
                      <span>{formatBrands(review.bubblyWater.brandName)}</span>
                    </Link>
                    <div class="text-yellow-400">
                      <Rating
                        readOnly
                        size="small"
                        value={review.rating}
                        precision={0.5}
                      />
                    </div>
                  </div>
                  <Link to={`/bubblyWater/${review.bubblyWater._id}`}>
                    <div class="mt-4">
                      <p class="text-gray-700 ml-2 text-left">
                        {review.reviewText}
                      </p>
                    </div>
                  </Link>
                </li>
              </Link>
            ))}
          </ul>
        </section>
      </section>
    </>
  );
}
