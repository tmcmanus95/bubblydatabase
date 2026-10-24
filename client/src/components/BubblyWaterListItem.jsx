import ProductCard from "./ProductCard";

export default function BubblyWaterListItem({
  bubblyWater,
  userId,
  ranking,
  isVerified,
}) {
  ranking = ranking + 1;
  const ratingCount = bubblyWater?.ratings?.length || 0;

  return (
    <section className="m-2 md:m-5 flex flex-col sm:flex-row items-center sm:items-start justify-center gap-4">
      <div className="font-bold text-xl sm:pt-6 sm:w-12 text-center">#{ranking}</div>
      <div className="w-full max-w-sm">
        <ProductCard bubblyWater={bubblyWater} ratingCount={ratingCount} />
      </div>
    </section>
  );
}
