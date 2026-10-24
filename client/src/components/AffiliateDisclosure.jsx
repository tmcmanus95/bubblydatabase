// Affiliate disclosure (P15-4), shown only when at least one where-to-buy link earns us a commission.
// Amazon requires its exact sentence whenever a tagged Amazon link is on the page.
export default function AffiliateDisclosure({ amazon }) {
  return (
    <p className="affiliate-disclosure" role="note">
      <strong>Fizz-closure:</strong> some of these links pay us a little if you buy something, at no extra cost to you. It never
      changes a rating.
      {amazon && <> As an Amazon Associate I earn from qualifying purchases.</>}
    </p>
  );
}
