// Search state lives in the URL (P1-20): /search?q=lime&flavor=lime,mint&caffeine=0&cbd=1&sort=popular&page=2
// Absent means "any". These turn URL params into search variables and back, so links, back/forward,
// refresh and sharing all keep the same search.
export const SORTS = { top: "TOP_RATED", popular: "MOST_RATED", name: "NAME", new: "NEWEST" };
export const PAGE_SIZE = 24;

const yesNo = (value) => (value === "1" ? true : value === "0" ? false : undefined);

export function readSearchParams(params) {
  const q = (params.get("q") || "").trim();
  const flavor = (params.get("flavor") || "")
    .split(",")
    .map((f) => f.trim().toLowerCase())
    .filter(Boolean);
  const sortKey = SORTS[params.get("sort")] ? params.get("sort") : "top";
  const page = Math.max(parseInt(params.get("page"), 10) || 1, 1);
  return { q, flavor, caffeine: yesNo(params.get("caffeine")), cbd: yesNo(params.get("cbd")), sortKey, page };
}

export function toVariables(state) {
  return {
    q: state.q || undefined,
    flavor: state.flavor.length ? state.flavor : undefined,
    caffeine: state.caffeine,
    cbd: state.cbd,
    sort: SORTS[state.sortKey],
    page: state.page,
    pageSize: PAGE_SIZE,
  };
}

// The query string for a search state, leaving out defaults so URLs stay short
export function toSearchString(state) {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  if (state.flavor && state.flavor.length) p.set("flavor", state.flavor.join(","));
  if (typeof state.caffeine === "boolean") p.set("caffeine", state.caffeine ? "1" : "0");
  if (typeof state.cbd === "boolean") p.set("cbd", state.cbd ? "1" : "0");
  if (state.sortKey && state.sortKey !== "top") p.set("sort", state.sortKey);
  if (state.page && state.page > 1) p.set("page", String(state.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const searchUrl = (state) => `/search${toSearchString({ flavor: [], ...state })}`;
