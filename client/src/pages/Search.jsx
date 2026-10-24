import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { QUERY_SEARCH, QUERY_SEARCH_USERS } from "../../utils/queries";
import { PAGE_SIZE, readSearchParams, toSearchString, toVariables } from "../../utils/searchParams";
import { formatBrands } from "../../utils/formatBrands";
import { errorMessage } from "../../utils/errorMessage";
import flavors from "../assets/flavors";
import ProductCard from "../components/ProductCard";
import Loading from "../components/Loading";

const FLAVOR_OPTIONS = flavors.map((f) => f.toLowerCase());
const YES_NO = [
  ["any", "Any"],
  ["1", "Yes"],
  ["0", "No"],
];
const fromYesNo = (v) => (v === "1" ? true : v === "0" ? false : undefined);
const toYesNo = (v) => (v === true ? "1" : v === false ? "0" : "any");

// The one search page (P1-20). Every control writes the URL, and the URL drives the query, so back/forward,
// refresh and shared links all show the same results.
export default function Search() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const state = readSearchParams(params);
  const [text, setText] = useState(state.q);
  const [flavorInput, setFlavorInput] = useState("");
  useEffect(() => setText(state.q), [state.q]);

  const go = (changes) => navigate(`/search${toSearchString({ ...state, page: 1, ...changes })}`);
  const { data, loading, error } = useQuery(QUERY_SEARCH, { variables: toVariables(state) });
  const { data: userData } = useQuery(QUERY_SEARCH_USERS, { variables: { username: state.q }, skip: !state.q });

  const addFlavor = (raw) => {
    const flavor = raw.trim().toLowerCase();
    setFlavorInput("");
    if (FLAVOR_OPTIONS.includes(flavor) && !state.flavor.includes(flavor)) go({ flavor: [...state.flavor, flavor] });
  };
  const result = data?.search;
  const pages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;
  const matchedUser = userData?.searchUsers;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-20">
      <h1 className="topBubblysHeader mb-4 text-4xl">Search</h1>
      <form
        role="search"
        className="mb-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: text.trim() });
        }}
      >
        <label htmlFor="search-q" className="sr-only">
          Search products and brands
        </label>
        <input
          id="search-q"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search products, brands, flavors..."
          className="min-w-0 flex-1 rounded-lg border-2 border-gray-400 px-3 py-2 text-black"
        />
        <button type="submit" className="rounded-lg border-2 border-current px-4 py-2 font-semibold">
          Search
        </button>
      </form>

      <section aria-label="Filters" className="mb-6 flex flex-wrap items-end gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addFlavor(flavorInput);
          }}
        >
          <label htmlFor="search-flavor" className="block text-sm font-semibold">
            Add a flavor
          </label>
          <input
            id="search-flavor"
            list="search-flavor-options"
            value={flavorInput}
            onChange={(e) => {
              setFlavorInput(e.target.value);
              if (FLAVOR_OPTIONS.includes(e.target.value.toLowerCase())) addFlavor(e.target.value);
            }}
            placeholder="lime, mango..."
            className="w-44 rounded border-2 border-gray-400 px-2 py-1 text-black"
          />
          <datalist id="search-flavor-options">
            {FLAVOR_OPTIONS.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </form>
        {[
          ["caffeine", "Caffeine"],
          ["cbd", "CBD"],
        ].map(([key, label]) => (
          <label key={key} className="text-sm font-semibold">
            {label}
            <select
              className="ml-2 block rounded border-2 border-gray-400 px-2 py-1 text-black"
              value={toYesNo(state[key])}
              onChange={(e) => go({ [key]: fromYesNo(e.target.value) })}
            >
              {YES_NO.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="text-sm font-semibold">
          Sort
          <select
            className="ml-2 block rounded border-2 border-gray-400 px-2 py-1 text-black"
            value={state.sortKey}
            onChange={(e) => go({ sortKey: e.target.value })}
          >
            <option value="top">Top rated</option>
            <option value="popular">Most rated</option>
            <option value="name">Name</option>
            <option value="new">Newest</option>
          </select>
        </label>
      </section>

      {state.flavor.length > 0 && (
        <ul className="mb-4 flex flex-wrap gap-2" aria-label="Selected flavors">
          {state.flavor.map((f) => (
            <li key={f}>
              <button
                type="button"
                onClick={() => go({ flavor: state.flavor.filter((x) => x !== f) })}
                className="rounded-full border-2 border-current px-3 py-0.5 text-sm"
                aria-label={`Remove ${formatBrands(f)}`}
              >
                {formatBrands(f)} ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {matchedUser && (
        <p className="mb-4">
          User:{" "}
          <Link className="font-semibold underline" to={`/user/${matchedUser._id}`}>
            {matchedUser.username}
          </Link>
        </p>
      )}

      {error ? (
        <p role="alert">{errorMessage(error)}</p>
      ) : loading && !result ? (
        <Loading />
      ) : (
        <>
          <p className="mb-4" aria-live="polite">
            {result.total === 0 ? "No bubbly waters match. Try fewer filters." : `${result.total} bubbly water${result.total === 1 ? "" : "s"}`}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.results.map((bw) => (
              <ProductCard key={bw._id} bubblyWater={bw} />
            ))}
          </div>
          {pages > 1 && (
            <nav aria-label="Pages" className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={state.page <= 1}
                onClick={() => go({ page: state.page - 1 })}
                className="rounded border-2 border-current px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {state.page} of {pages}
              </span>
              <button
                type="button"
                disabled={state.page >= pages}
                onClick={() => go({ page: state.page + 1 })}
                className="rounded border-2 border-current px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
