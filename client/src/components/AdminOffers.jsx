import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { QUERY_ADMIN_OFFERS } from "../../utils/queries";
import { ADD_OFFER, EDIT_OFFER, SET_OFFER_ACTIVE } from "../../utils/mutations";
import { errorMessage } from "../../utils/errorMessage";

// Where-to-buy management for admins (P15-2), shown on the product page only when me.isAdmin. The server
// checks the admin role on every call; this form is just a convenience.
const NETWORKS = ["amazon", "direct", "impact", "cj", "awin", "rakuten"];
const EMPTY = { retailer: "", network: "amazon", asin: "", url: "", affiliateUrl: "", packSize: "", active: true };

const toInput = (f) => ({
  retailer: f.retailer.trim(),
  network: f.network,
  asin: f.network === "amazon" ? f.asin.trim() || null : null,
  url: f.url.trim() || null,
  affiliateUrl: f.affiliateUrl.trim() || null,
  packSize: f.packSize.trim() || null,
  active: f.active,
});

export default function AdminOffers({ bubblyWaterId }) {
  const variables = { bubblyWaterId };
  const { data, error: loadError } = useQuery(QUERY_ADMIN_OFFERS, { variables });
  const refetchQueries = [{ query: QUERY_ADMIN_OFFERS, variables }];
  const [addOffer, add] = useMutation(ADD_OFFER, { refetchQueries });
  const [editOffer, edit] = useMutation(EDIT_OFFER, { refetchQueries });
  const [setActive, toggle] = useMutation(SET_OFFER_ACTIVE, { refetchQueries });
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const error = loadError || add.error || edit.error || toggle.error;
  const field = (name) => ({ value: form[name], onChange: (e) => setForm({ ...form, [name]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await editOffer({ variables: { ...variables, offerId: editingId, offer: toInput(form) } });
      else await addOffer({ variables: { ...variables, offer: toInput(form) } });
      setForm(EMPTY);
      setEditingId(null);
    } catch {
      // shown below
    }
  };

  return (
    <section className="mx-auto my-8 max-w-xl rounded-lg border-2 border-dashed border-current p-4 text-left" aria-label="Admin: where to buy">
      <h2 className="mb-2 text-xl font-semibold">Admin · Where to buy</h2>
      <ul className="mb-4 space-y-2">
        {(data?.adminOffers || []).map((o) => (
          <li key={o._id} className={`flex flex-wrap items-center gap-2 ${o.active ? "" : "opacity-60"}`}>
            <strong>{o.retailer}</strong>
            <span className="text-sm">
              {o.network}
              {o.asin ? ` · ${o.asin}` : ""}
              {o.packSize ? ` · ${o.packSize}` : ""} · link {o.status}
            </span>
            <button
              type="button"
              className="underline"
              onClick={() => {
                setEditingId(o._id);
                setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v ?? ""])), active: o.active });
              }}
            >
              Edit
            </button>
            <button type="button" className="underline" onClick={() => setActive({ variables: { ...variables, offerId: o._id, active: !o.active } }).catch(() => {})}>
              {o.active ? "Deactivate" : "Activate"}
            </button>
          </li>
        ))}
        {data && data.adminOffers.length === 0 && <li className="text-sm">No offers yet.</li>}
      </ul>
      <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm">
          Retailer
          <input className="block w-full rounded border px-2 py-1 text-black" required {...field("retailer")} />
        </label>
        <label className="text-sm">
          Network
          <select className="block w-full rounded border px-2 py-1 text-black" {...field("network")}>
            {NETWORKS.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        {form.network === "amazon" ? (
          <label className="text-sm">
            ASIN
            <input className="block w-full rounded border px-2 py-1 text-black" placeholder="B0XXXXXXXX" {...field("asin")} />
          </label>
        ) : (
          <label className="text-sm">
            Product URL (https)
            <input className="block w-full rounded border px-2 py-1 text-black" {...field("url")} />
          </label>
        )}
        {form.network !== "amazon" && (
          <label className="text-sm">
            Affiliate URL (optional)
            <input className="block w-full rounded border px-2 py-1 text-black" {...field("affiliateUrl")} />
          </label>
        )}
        <label className="text-sm">
          Pack size (optional)
          <input className="block w-full rounded border px-2 py-1 text-black" placeholder="12 × 12 oz" {...field("packSize")} />
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="rounded border-2 border-current px-3 py-1 font-semibold">
            {editingId ? "Save offer" : "Add offer"}
          </button>
          {editingId && (
            <button
              type="button"
              className="underline"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm">
          {errorMessage(error)}
        </p>
      )}
    </section>
  );
}
