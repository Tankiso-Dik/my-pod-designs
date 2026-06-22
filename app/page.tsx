"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useState, useRef } from "react";

type Marketplace = { name: string; details: string; uploaded: boolean };

export default function Home() {
  const products = useQuery(api.products.list);
  const create = useMutation(api.products.create);
  const remove = useMutation(api.products.remove);

  const [expandedId, setExpandedId] = useState<Id<"products"> | null>(null);

  if (products === undefined) {
    return (
      <div className="flex items-center justify-center min-h-dvh text-neutral-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Designs</h1>
        <button
          onClick={() => create()}
          className="bg-neutral-200 text-neutral-900 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-neutral-300 cursor-pointer"
        >
          + New Entry
        </button>
      </div>

      {products.length === 0 ? (
        <p className="text-neutral-500 text-sm">No entries yet.</p>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <ProductCard
              key={p._id}
              product={p}
              isExpanded={expandedId === p._id}
              onToggle={() =>
                setExpandedId(expandedId === p._id ? null : p._id)
              }
              onDelete={() => remove({ id: p._id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  isExpanded,
  onToggle,
  onDelete,
}: {
  product: NonNullable<ReturnType<typeof useQuery<typeof api.products.list>>>[number];
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-neutral-800/50 transition-colors cursor-pointer text-left"
      >
        <span className="text-neutral-500 font-mono text-sm w-8 shrink-0">
          #{product.number}
        </span>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            className="w-10 h-10 rounded-lg object-cover shrink-0 bg-neutral-800"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-neutral-800 shrink-0 flex items-center justify-center text-neutral-600 text-xs">
            -
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {product.marketplaces.map((m) => (
            <span
              key={m.name}
              className={`text-xs px-2 py-0.5 rounded-full ${
                m.uploaded
                  ? "bg-green-900/50 text-green-300"
                  : "bg-neutral-800 text-neutral-500"
              }`}
            >
              {m.name}
            </span>
          ))}
        </div>
        <svg
          className={`w-4 h-4 text-neutral-600 shrink-0 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <ProductForm
          product={product}
          onDelete={() => {
            setDeleting(true);
            onDelete();
          }}
        />
      )}

      {deleting && (
        <p className="px-3 pb-3 text-xs text-neutral-500">Deleted.</p>
      )}
    </div>
  );
}

function ProductForm({
  product,
  onDelete,
}: {
  product: NonNullable<ReturnType<typeof useQuery<typeof api.products.list>>>[number];
  onDelete: () => void;
}) {
  const setImageMutation = useMutation(api.products.setImage);
  const deleteImageMutation = useMutation(api.products.deleteImage);
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);
  const updateMps = useMutation(api.products.updateMarketplaces);

  const fileRef = useRef<HTMLInputElement>(null);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>(
    () => product.marketplaces
  );
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingMarketplace, setAddingMarketplace] = useState(false);
  const [newName, setNewName] = useState("");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await generateUploadUrl();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await res.json();
    await setImageMutation({ id: product._id, storageId });
  }

  function updateMarketplace(
    i: number,
    field: "details" | "uploaded",
    value: string | boolean
  ) {
    setMarketplaces((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function addMarketplace() {
    if (!newName.trim()) return;
    setMarketplaces((prev) => [
      ...prev,
      { name: newName.trim(), details: "", uploaded: false },
    ]);
    setNewName("");
    setAddingMarketplace(false);
  }

  function removeMarketplace(i: number) {
    setMarketplaces((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    await updateMps({ id: product._id, marketplaces });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="border-t border-neutral-800 p-4 space-y-4">
      {/* Image */}
      <div>
        <p className="text-xs text-neutral-500 mb-2">Image</p>
        <div className="flex items-start gap-3">
          {product.imageUrl ? (
            <div className="relative group">
              <img
                src={product.imageUrl}
                alt=""
                className="w-28 h-28 rounded-lg object-cover bg-neutral-800"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <a
                  href={product.imageUrl}
                  download
                  className="text-xs bg-neutral-200 text-neutral-900 px-2 py-1 rounded"
                >
                  Download
                </a>
                <button
                  onClick={() => deleteImageMutation({ id: product._id })}
                  className="text-xs bg-red-600 text-white px-2 py-1 rounded cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="w-28 h-28 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-600 text-xs">
              No image
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
            >
              Upload Image
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Marketplaces */}
      <div className="space-y-2">
        <p className="text-xs text-neutral-500">Marketplaces</p>
        {marketplaces.map((mp, i) => (
          <div
            key={mp.name}
            className="bg-neutral-800/50 rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{mp.name}</span>
              <button
                onClick={() => removeMarketplace(i)}
                className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
              >
                Remove
              </button>
            </div>
            <textarea
              value={mp.details}
              onChange={(e) => updateMarketplace(i, "details", e.target.value)}
              placeholder="Listing details..."
              rows={2}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-sm placeholder-neutral-600 resize-none focus:outline-none focus:border-neutral-500"
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={mp.uploaded}
                onChange={(e) =>
                  updateMarketplace(i, "uploaded", e.target.checked)
                }
                className="accent-green-500"
              />
              Uploaded
            </label>
          </div>
        ))}

        {addingMarketplace ? (
          <div className="flex items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Marketplace name"
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              onKeyDown={(e) => e.key === "Enter" && addMarketplace()}
              autoFocus
            />
            <button
              onClick={addMarketplace}
              className="text-sm bg-neutral-200 text-neutral-900 px-3 py-1.5 rounded-lg font-medium cursor-pointer hover:bg-neutral-300"
            >
              Add
            </button>
            <button
              onClick={() => setAddingMarketplace(false)}
              className="text-sm text-neutral-500 cursor-pointer hover:text-neutral-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingMarketplace(true)}
            className="text-sm text-neutral-400 hover:text-neutral-200 cursor-pointer"
          >
            + Add marketplace
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={handleSave}
          className="bg-green-700 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors"
        >
          {saved ? "Saved!" : "Save"}
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors"
            >
              Confirm Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-sm text-neutral-500 cursor-pointer hover:text-neutral-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm text-red-400 hover:text-red-300 cursor-pointer ml-auto"
          >
            Delete entry
          </button>
        )}
      </div>
    </div>
  );
}
