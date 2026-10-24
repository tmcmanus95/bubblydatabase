import ProductCard from "./ProductCard";

// A user's reviews: a compact card per product (their rating in the score slot, if they rated it),
// with the review text underneath
export default function UsersReviews({ reviews }) {
  return (
    <section>
      <ul className="p-5 flex flex-col items-center gap-4">
        {reviews?.map((review, index) => (
          <li key={review._id ?? index} className="w-full max-w-md">
            <ProductCard
              bubblyWater={review.bubblyWater}
              variant="compact"
              score={review.rating?.rating}
              scoreDetail="rated"
              showScore={typeof review.rating?.rating === "number"}
            />
            <p className="mt-2 px-3 text-left break-words">{review.reviewText}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
