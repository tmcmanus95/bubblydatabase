import { useQuery } from "@apollo/client";
import { QUERY_ALL_BUBBLYS } from "../../../utils/queries";
import ProductCard from "../../components/ProductCard";
import Loading from "../../components/Loading";

// Work-in-progress preview of the typographic product cards (P1-0b) with real data, before they
// replace the product photos (P1-0c). Not linked from the site.
export default function CardPreview() {
  const { data, error } = useQuery(QUERY_ALL_BUBBLYS);
  if (error) return <p className="m-8">Couldn't load bubblies: {error.message}</p>;
  if (!data) return <Loading />;
  const bubblies = data.bubblyWaters;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-24">
      <h1 className="topBubblysHeader mb-6 text-4xl">Card preview</h1>
      <h2 className="mb-3 text-xl font-semibold">Full</h2>
      <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {bubblies.slice(0, 12).map((bw) => (
          <ProductCard key={bw._id} bubblyWater={bw} />
        ))}
      </div>
      <h2 className="mb-3 text-xl font-semibold">Compact</h2>
      <div className="grid max-w-xl gap-4">
        {bubblies.slice(12, 18).map((bw) => (
          <ProductCard key={bw._id} bubblyWater={bw} variant="compact" />
        ))}
      </div>
    </main>
  );
}
