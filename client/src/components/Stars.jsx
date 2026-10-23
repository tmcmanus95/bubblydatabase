// Read-only star display (0–5, any fraction). Decorative: pair it with the number as text.
// The interactive rating control is a separate component (roadmap P1-21).
const STAR = "M12 2.8l2.7 5.9 6.4.7-4.8 4.4 1.3 6.3L12 17l-5.6 3.1 1.3-6.3-4.8-4.4 6.4-.7z";

// Filled stars use var(--star) / var(--star-dark) when set (see starStyle in theme/flavorSurface.js),
// else the text color. Outlines always use the text color.
function StarRow({ filled }) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="stars__star" focusable="false">
          <path
            d={STAR}
            className={filled ? "stars__fill" : undefined}
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </>
  );
}

export default function Stars({ value, className = "", style }) {
  const percent = Math.max(0, Math.min(5, value || 0)) * 20;
  return (
    <span className={`stars ${className}`} style={style} aria-hidden="true">
      <span className="stars__row">
        <StarRow filled={false} />
      </span>
      <span className="stars__row stars__row--filled" style={{ width: `${percent}%` }}>
        <StarRow filled />
      </span>
    </span>
  );
}
