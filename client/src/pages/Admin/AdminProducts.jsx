import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Link } from "react-router-dom";
import { QUERY_ADMIN_PRODUCTS, QUERY_MEID } from "../../../utils/queries";
import { ARCHIVE_PRODUCT, BULK_EDIT_PRODUCTS, CREATE_PRODUCT, RESTORE_PRODUCT, UPDATE_PRODUCT } from "../../../utils/mutations";
import { errorMessage } from "../../../utils/errorMessage";
import { formatBrands } from "../../../utils/formatBrands";
import Loading from "../../components/Loading";

// Admin products page (P2-3): find any product (archived ones too), edit or add one, archive/restore, and
// bulk-edit flavors and tags. The server checks the admin role on every call; this page only hides itself.
const EMPTY = { productName: "", brandName: "", flavor: "", tags: "", isCaffeinated: false, hasCBD: false };
const list = (text) => text.split(",").map((x) => x.trim()).filter(Boolean);
const toInput = (f) => ({
  productName: f.productName,
  brandName: f.brandName,
  flavor: list(f.flavor),
  tags: list(f.tags),
  isCaffeinated: f.isCaffeinated,
  hasCBD: f.hasCBD,
});

export default function AdminProducts() {
  const { data: me, loading: meLoading } = useQuery(QUERY_MEID);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const variables = { q: search || undefined, page };
  const isAdmin = Boolean(me?.meId?.isAdmin);
  const { data, loading, error: loadError } = useQuery(QUERY_ADMIN_PRODUCTS, { variables, skip: !isAdmin });
  const refetchQueries = [{ query: QUERY_ADMIN_PRODUCTS, variables }];
  const [createProduct, c] = useMutation(CREATE_PRODUCT, { refetchQueries });
  const [updateProduct, u] = useMutation(UPDATE_PRODUCT, { refetchQueries });
  const [archive, a] = useMutation(ARCHIVE_PRODUCT, { refetchQueries });
  const [restore, r] = useMutation(RESTORE_PRODUCT, { refetchQueries });
  const [bulkEdit, b] = useMutation(BULK_EDIT_PRODUCTS, { refetchQueries });
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulk, setBulk] = useState({ addFlavors: "", removeFlavors: "", addTags: "", removeTags: "" });
  const [notice, setNotice] = useState("");
  const error = loadError || c.error || u.error || a.error || r.error || b.error;

  if (meLoading) return <Loading />;
  if (!isAdmin) return <main className="mx-auto max-w-3xl px-4 pt-24">Admins only.</main>;

  const field = (name) => ({ value: form[name], onChange: (e) => setForm({ ...form, [name]: e.target.value }) });
  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await updateProduct({ variables: { bubblyWaterId: editingId, product: toInput(form) } });
      else await createProduct({ variables: { product: toInput(form) } });
      setNotice(editingId ? `Saved ${form.productName}.` : `Added ${form.productName}.`);
      setForm(EMPTY);
      setEditingId(null);
    } catch {
      // shown below
    }
  };
  const runBulk = async (e) => {
    e.preventDefault();
    try {
      await bulkEdit({
        variables: {
          bubblyWaterIds: [...selected],
          addFlavors: list(bulk.addFlavors),
          removeFlavors: list(bulk.removeFlavors),
          addTags: list(bulk.addTags),
          removeTags: list(bulk.removeTags),
        },
      });
      setNotice(`Updated ${selected.size} product${selected.size === 1 ? "" : "s"}.`);
      setSelected(new Set());
      setBulk({ addFlavors: "", removeFlavors: "", addTags: "", removeTags: "" });
    } catch {
      // shown below
    }
  };
  const result = data?.search;
  const pages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-12 pt-20">
      <h1 className="topBubblysHeader mb-4 text-4xl">Admin · Products</h1>

      <form onSubmit={submit} className="mb-6 grid gap-2 rounded-lg border-2 border-dashed border-current p-4 sm:grid-cols-2" aria-label={editingId ? "Edit product" : "Add product"}>
        <h2 className="text-lg font-semibold sm:col-span-2">{editingId ? `Edit ${form.productName}` : "Add a product"}</h2>
        <label className="text-sm">
          Name
          <input className="block w-full rounded border px-2 py-1 text-black" required {...field("productName")} />
        </label>
        <label className="text-sm">
          Brand (e.g. la-croix)
          <input className="block w-full rounded border px-2 py-1 text-black" required {...field("brandName")} />
        </label>
        <label className="text-sm">
          Flavors (comma separated)
          <input className="block w-full rounded border px-2 py-1 text-black" required placeholder="lime, mint" {...field("flavor")} />
        </label>
        <label className="text-sm">
          Tags (comma separated)
          <input className="block w-full rounded border px-2 py-1 text-black" {...field("tags")} />
        </label>
        <label className="text-sm">
          <input type="checkbox" checked={form.isCaffeinated} onChange={(e) => setForm({ ...form, isCaffeinated: e.target.checked })} /> Caffeine
        </label>
        <label className="text-sm">
          <input type="checkbox" checked={form.hasCBD} onChange={(e) => setForm({ ...form, hasCBD: e.target.checked })} /> CBD
        </label>
        <div className="flex gap-3 sm:col-span-2">
          <button type="submit" className="rounded border-2 border-current px-3 py-1 font-semibold">
            {editingId ? "Save" : "Add product"}
          </button>
          {editingId && (
            <button type="button" className="underline" onClick={() => (setEditingId(null), setForm(EMPTY))}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {notice && (
        <p role="status" className="mb-3">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-3">
          {errorMessage(error)}
        </p>
      )}

      <form
        role="search"
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q.trim());
        }}
      >
        <input className="min-w-0 flex-1 rounded border-2 px-3 py-1 text-black" placeholder="Find a product (archived included)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a product" />
        <button type="submit" className="rounded border-2 border-current px-3 py-1">
          Find
        </button>
      </form>

      {selected.size > 0 && (
        <form onSubmit={runBulk} className="mb-3 flex flex-wrap items-end gap-2 rounded border-2 border-current p-2" aria-label="Bulk edit">
          <strong className="w-full">{selected.size} selected</strong>
          {[
            ["addFlavors", "Add flavors"],
            ["removeFlavors", "Remove flavors"],
            ["addTags", "Add tags"],
            ["removeTags", "Remove tags"],
          ].map(([key, label]) => (
            <label key={key} className="text-sm">
              {label}
              <input className="block w-36 rounded border px-2 py-1 text-black" value={bulk[key]} onChange={(e) => setBulk({ ...bulk, [key]: e.target.value })} />
            </label>
          ))}
          <button type="submit" className="rounded border-2 border-current px-3 py-1 font-semibold">
            Apply
          </button>
        </form>
      )}

      {loading && !result ? (
        <Loading />
      ) : (
        <>
          <p className="mb-2">{result?.total ?? 0} products</p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="w-8" aria-label="Select" />
                <th>Product</th>
                <th>Flavors</th>
                <th>Tags</th>
                <th>Ratings</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {result?.results.map((p) => (
                <tr key={p._id} className={`border-t ${p.archivedAt ? "opacity-60" : ""}`}>
                  <td>
                    <input type="checkbox" aria-label={`Select ${p.productName}`} checked={selected.has(p._id)} onChange={() => toggle(p._id)} />
                  </td>
                  <td className="py-1">
                    <Link className="underline" to={`/bubblyWater/${p._id}`}>
                      {p.productName}
                    </Link>{" "}
                    · {formatBrands(p.brandName)}
                    {p.archivedAt && <em> (archived)</em>}
                  </td>
                  <td>{p.flavor.join(", ")}</td>
                  <td>{(p.tags || []).join(", ")}</td>
                  <td>{p.ratingCount ?? 0}</td>
                  <td className="whitespace-nowrap">
                    <button
                      type="button"
                      className="mr-2 underline"
                      onClick={() => {
                        setEditingId(p._id);
                        setForm({ productName: p.productName, brandName: p.brandName, flavor: p.flavor.join(", "), tags: (p.tags || []).join(", "), isCaffeinated: Boolean(p.isCaffeinated), hasCBD: Boolean(p.hasCBD) });
                        window.scrollTo({ top: 0 });
                      }}
                    >
                      Edit
                    </button>
                    {p.archivedAt ? (
                      <button type="button" className="underline" onClick={() => restore({ variables: { bubblyWaterId: p._id } }).catch(() => {})}>
                        Restore
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="underline"
                        onClick={() => window.confirm(`Archive ${p.productName}? It disappears from the site (ratings are kept, and you can restore it).`) && archive({ variables: { bubblyWaterId: p._id } }).catch(() => {})}
                      >
                        Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pages > 1 && (
            <nav className="mt-4 flex items-center gap-3" aria-label="Pages">
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="underline disabled:opacity-40">
                Previous
              </button>
              <span>
                Page {page} of {pages}
              </span>
              <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)} className="underline disabled:opacity-40">
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
