import { flavorCategory } from "../theme/flavorCategories";

// Placeholder flavor-category icons, drawn in code, until the illustrated set from the Phase 4
// designer brief exists. They use the surrounding text color and are decorative (aria-hidden).
const PATHS = {
  citrus: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="6.2" />
      <path d="M12 5.9v12.2M6.7 8.9l10.6 6.2M6.7 15.1l10.6-6.2" />
    </>
  ),
  berry: (
    <>
      <circle cx="9" cy="13" r="3.4" />
      <circle cx="15.2" cy="13.4" r="3.2" />
      <circle cx="12.1" cy="17.9" r="3.1" />
      <path d="M12 9.6c-.4-2.3.6-4.4 2.9-5.4M12 9.6C10.6 8 8.7 7.6 7 8.3" />
    </>
  ),
  stone: (
    <>
      <path d="M12 8.2c4.9-1.4 8 1.6 7.6 6.2-.4 4.4-3.7 6.6-7.6 6.6S4.8 18.8 4.4 14.4C4 9.8 7.1 6.8 12 8.2Z" />
      <path d="M12 8.2c0-2 .7-3.7 2.1-4.9" />
      <path d="M14.1 3.3c1.8.1 3.4 1 4.1 2.6-1.8.4-3.4-.2-4.1-2.6Z" />
      <path d="M11.4 9.4c-1.8 3.2-1.6 7.8.6 11.4" />
    </>
  ),
  tropical: (
    <>
      <path d="M12 9.6c3.2 0 5.3 2.7 5.3 5.9S15.2 21.2 12 21.2s-5.3-2.5-5.7-5.7S8.8 9.6 12 9.6Z" />
      <path d="M8.4 13.4 12 17l3.6-3.6M8.6 17.4l3.4-3.4 3.4 3.4" />
      <path d="M12 9.6V6.2M12 9.4C10.8 7.4 9.2 6.6 7.6 6.8M12 9.4c1.2-2 2.8-2.8 4.4-2.6M12 6.2c-.6-1.2-.4-2.2.2-3" />
    </>
  ),
  orchard: (
    <>
      <path d="M12 8.6c-2.4-1.8-7.1-1-7.5 4.2-.4 4.8 2.8 8.4 5.3 8.2 1 0 1.4-.6 2.2-.6s1.2.6 2.2.6c2.5.2 5.7-3.4 5.3-8.2-.4-5.2-5.1-6-7.5-4.2Z" />
      <path d="M12 8.6c.1-1.8.7-3.4 1.9-4.6" />
      <path d="M13 6.4c.9-1.6 2.6-2.3 4.3-1.9-.6 1.7-2.3 2.5-4.3 1.9Z" />
    </>
  ),
  melon: (
    <>
      <path d="M3 9.5h18a9 9 0 0 1-18 0Z" />
      <path d="M5.4 9.6a6.6 6.6 0 0 0 13.2 0" />
      <path d="M9 12.6v.1M12 14.1v.1M15 12.6v.1" strokeWidth="2.6" />
    </>
  ),
  botanical: (
    <>
      <path d="M5.2 18.8C4.6 11.4 9 5.6 18.9 5.1c.5 9.9-5.3 14.3-12.7 13.7Z" />
      <path d="M5 19c3.1-4.1 6.4-7.1 10.2-9.6" />
    </>
  ),
  spice: (
    <>
      <path d="M12 3.6 13.6 9l5.6-.6-4.1 3.8 2.6 5-5-2.4-3.2 4.6-.3-5.6-5.4-1.6 5.3-2L8.6 4.4Z" />
      <circle cx="12" cy="11.6" r="1.1" />
    </>
  ),
  brewed: (
    <>
      <path d="M5 10.5h11v4.2a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5Z" />
      <path d="M16 11.6h1.4a2.3 2.3 0 0 1 0 4.6H15.6" />
      <path d="M8.5 7.6c-.8-1 .8-1.8 0-3M12 7.6c-.8-1 .8-1.8 0-3" />
    </>
  ),
  plain: (
    <>
      <path d="M8 4.5h8l-.9 15.2a1.5 1.5 0 0 1-1.5 1.3h-3.2a1.5 1.5 0 0 1-1.5-1.3Z" />
      <path d="M8.4 9.5h7.2" />
      <circle cx="11.2" cy="13.6" r=".9" />
      <circle cx="13" cy="16.6" r=".7" />
    </>
  ),
  bubbles: (
    <>
      <circle cx="9" cy="15" r="4.2" />
      <circle cx="16.4" cy="9.8" r="2.8" />
      <circle cx="10.6" cy="6.2" r="1.6" />
    </>
  ),
};

export default function FlavorIcon({ flavor, className = "" }) {
  const category = flavorCategory(flavor);
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      data-category={category}
    >
      {PATHS[category]}
    </svg>
  );
}
