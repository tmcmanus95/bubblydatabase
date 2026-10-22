import ProductCard from "./ProductCard";

// A user's ratings: one compact card per product, with their rating in the score slot
export default function UsersRatings({ ratings }) {
  return (
    <section>
      <ul className="p-5 flex flex-col items-center gap-3">
        {ratings?.map((rating) => (
          <li key={rating._id ?? rating.bubblyWater._id} className="w-full max-w-md">
            <ProductCard bubblyWater={rating.bubblyWater} variant="compact" score={rating.rating} scoreDetail="rated" />
          </li>
        ))}
      </ul>
    </section>
  );
}
