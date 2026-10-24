import AffiliateDisclosure from "./AffiliateDisclosure";

// "Where to buy" on the product page (P15-5): active offers only, each going through our /go redirect
// (which picks the right, possibly tagged, link and counts the click anonymously). Hidden when there are none.
export default function WhereToBuy({ productId, offers }) {
  if (!offers || offers.length === 0) return null;
  const sponsored = offers.filter((o) => o.sponsored);
  return (
    <section className="where-to-buy" aria-labelledby="where-to-buy-heading">
      <h2 id="where-to-buy-heading" className="where-to-buy__title">
        Where to buy
      </h2>
      <ul className="where-to-buy__list">
        {offers.map((o) => (
          <li key={o._id}>
            <a
              className="where-to-buy__link"
              href={`/go/${productId}/${o._id}`}
              target="_blank"
              rel={o.sponsored ? "sponsored nofollow noopener" : "nofollow noopener"}
            >
              <span className="where-to-buy__retailer">{o.retailer}</span>
              {o.packSize && <span className="where-to-buy__pack">{o.packSize}</span>}
              <span aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
      {sponsored.length > 0 && <AffiliateDisclosure amazon={sponsored.some((o) => o.network === "amazon")} />}
    </section>
  );
}
