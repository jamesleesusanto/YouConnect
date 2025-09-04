"use client";
import { useEffect, useRef, useState } from "react";

export default function LocationModal({
  open,
  initialLabel = "",                 // prefill, e.g. saved label
  onResolved,                         // ({ coords: {lat,lng}, label }) => void
  onClose,                            // () => void
  persistKeys = {                     // override if you want
    coords: "yc_user_coords",
    label: "yc_user_label",
  },
}) {
  const inputRef = useRef(null);
  const [value, setValue] = useState(initialLabel);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // keep input in sync when modal opens with a new initialLabel
  useEffect(() => {
    if (open) setValue(initialLabel || "");
  }, [open, initialLabel]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => inputRef.current?.focus());

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      cancelAnimationFrame(id);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function geocodeLocation(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Geocoding failed");
    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) throw new Error("No results");
    const first = results[0];
    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
  }

  function persist(coords, label) {
    try {
      localStorage.setItem(persistKeys.coords, JSON.stringify(coords));
      localStorage.setItem(persistKeys.label, label);
    } catch {}
  }

  async function handleSaveFromInput() {
    try {
      setErr("");
      setLoading(true);
      const coords = await geocodeLocation(value.trim());
      persist(coords, value.trim());
      onResolved?.({ coords, label: value.trim() });
      onClose();
    } catch (e) {
      setErr("Couldn't find that place. Try a ZIP or 'City, State'.");
    } finally {
      setLoading(false);
    }
  }

  function handleUseMyLocation() {
    setErr("");
    if (!navigator.geolocation) {
      setErr("Geolocation not supported in this browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        persist(coords, "My Location");
        onResolved?.({ coords, label: "My Location" });
        setLoading(false);
        onClose();
      },
      (error) => {
        setErr(error?.message || "Could not get your location.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && value.trim() && !loading) {
      e.preventDefault();
      handleSaveFromInput();
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full text-black">
        <h2 id="location-modal-title" className="text-xl font-bold mb-4">
          Set Location
        </h2>

        <input
          ref={inputRef}
          type="text"
          placeholder="ZIP or City, State (e.g., 48104 or Austin, TX)"
          className="w-full border rounded-lg p-2 mb-2"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        />

        {err ? <p className="text-sm text-red-600 mb-2">{err}</p> : null}

        <div className="flex justify-between items-center mt-2">

            
          {/* <button
            className="px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-100 cursor-pointer"
            onClick={handleUseMyLocation}
            disabled={loading}
          >
            Use My Location
          </button> */}

          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-purple-700 text-white hover:bg-purple-900 disabled:opacity-80 cursor-pointer"
              onClick={handleSaveFromInput}
              disabled={loading || !value.trim()}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
