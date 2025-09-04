"use client";

import { useEffect, useRef } from "react";

export default function OpportunityModal({ open, opp, onClose, getTagColor }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const id = requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      cancelAnimationFrame(id);
    };
  }, [open, onClose]);

  if (!open || !opp) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="opp-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl p-10 max-w-2xl w-full relative text-gray-800">
        <button
          ref={closeBtnRef}
          className="absolute top-4 right-4 text-2xl text-purple-700 font-bold cursor-pointer"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <h2 id="opp-modal-title" className="text-3xl font-extrabold mb-2 text-purple-700">
          {opp.name}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p>
              <span className="font-bold text-purple-600">Organization:</span> {opp.organization}
            </p>

            <p>
              <span className="font-bold text-purple-600">Location:</span> {opp.location}
              {opp.remoteType === "Remote" && (
                <>
                  <img src="/computer.svg" alt="Remote" className="inline w-4 h-4 ml-1" />
                  <span className="ml-2 text-xs font-semibold text-blue-600">Remote</span>
                </>
              )}
            </p>

            <p>
              <span className="font-bold text-purple-600">Date/Time:</span> {opp.dateTime}
            </p>
          </div>

          <div>
            <p>
              <span className="font-bold text-purple-600">Age Group:</span>{" "}
              {Array.isArray(opp.ageGroups) ? opp.ageGroups.join(", ") : opp.ageGroups}
            </p>

            <p>
              <span className="font-bold text-purple-600">Industry:</span>
              {Array.isArray(opp.tags) &&
                opp.tags.map((tag, i) => (
                  <span
                    key={`${tag}-${i}`}
                    className={`inline-block ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getTagColor(tag)}`}
                  >
                    {tag}
                  </span>
                ))}
            </p>
          </div>
        </div>

        <p className="mb-2">
          <span className="font-bold text-purple-600">Description:</span> {opp.description}
        </p>
        <p>
          <span className="font-bold text-purple-600">Contact:</span> {opp.contact}
        </p>
      </div>
    </div>
  );
}
