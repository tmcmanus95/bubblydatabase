// The logged-in user's own ratings, shared by every rating control on the page (P1-22). Components ask for
// the products they show; requests made in the same moment are batched into one myRatings query. Optimistic
// updates go through `setMine`, so every card for that product updates at once.
import { useEffect, useSyncExternalStore } from "react";
import { QUERY_MY_RATINGS } from "./queries";

const known = new Map(); // productId -> { rating, ratingId } | null (null = not rated)
const pending = new Set();
const listeners = new Set();
let client = null;
let timer = null;
let version = 0;

const notify = () => {
  version += 1;
  listeners.forEach((l) => l());
};

export function setApolloClient(apolloClient) {
  client = apolloClient;
}

const flush = async () => {
  timer = null;
  const ids = [...pending];
  pending.clear();
  if (!ids.length || !client) return;
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    try {
      const { data } = await client.query({ query: QUERY_MY_RATINGS, variables: { ids: chunk }, fetchPolicy: "network-only" });
      chunk.forEach((id) => known.set(id, null));
      for (const r of data.myRatings) known.set(r.bubblyWaterId, { rating: r.rating, ratingId: r._id });
    } catch {
      chunk.forEach((id) => known.delete(id)); // try again next time it's asked for
    }
  }
  notify();
};

export function requestMine(productId) {
  if (!productId || known.has(productId) || pending.has(productId)) return;
  pending.add(productId);
  if (!timer) timer = setTimeout(flush, 10);
}

export function getMine(productId) {
  return known.get(productId);
}

export function setMine(productId, value) {
  known.set(productId, value);
  notify();
}

export function refreshMine(productId) {
  known.delete(productId);
  requestMine(productId);
}

// { rating, ratingId } once known, null if not rated, undefined while loading (or when `enabled` is false)
export function useMyRating(productId, enabled = true) {
  useEffect(() => {
    if (enabled) requestMine(productId);
  }, [productId, enabled]);
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version
  );
  return enabled ? known.get(productId) : undefined;
}

// For tests
export function resetMyRatings() {
  known.clear();
  pending.clear();
}
