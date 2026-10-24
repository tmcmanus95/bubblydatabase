import { capitalizeFlavors } from "../../utils/capitalizeFlavors";
import Auth from "../../utils/auth";
import CustomColorRating from "./CustomColorRating";
import ProductCard from "./ProductCard";

export default function BubblyWaterListItem({
  bubblyWater,
  userId,
  ranking,
  isVerified,
}) {
  ranking = ranking + 1;
  const capitalizedFlavors = capitalizeFlavors(bubblyWater);
  const ratingCount = bubblyWater?.ratings?.length || 0;

  return (
    <section className="m-2 md:m-5 flex flex-col sm:flex-row items-center sm:items-start justify-center gap-4">
      <div className="font-bold text-xl sm:pt-6 sm:w-12 text-center">#{ranking}</div>
      <div className="w-full max-w-sm">
        <ProductCard bubblyWater={bubblyWater} ratingCount={ratingCount} />
      </div>
      {Auth.loggedIn() && (
        <div className="flex flex-col items-center sm:items-start gap-1 sm:pt-6 sm:w-60">
          {/* Anyone logged in can rate; verifying email is only needed to write reviews (P1-17) */}
          <span>Your rating:</span>
          <CustomColorRating
            flavor={capitalizedFlavors[0]}
            rating={bubblyWater.averageRating}
            bubblyWaterId={bubblyWater._id}
            userId={userId}
            isVerified={isVerified}
          />
        </div>
      )}
    </section>
  );
}
