"use client";

export default function Toggle({ checked, onChange, label = "Remote only" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={`group relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300
        ${checked ? "bg-purple-700" : "bg-gray-300"}
        focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 cursor-pointer`}
    >
      {/* hover glow */}
      <span
        className={`pointer-events-none absolute inset-0 rounded-full transition-opacity duration-200
          ${checked ? "group-hover:opacity-40" : "group-hover:opacity-30"} opacity-0`}
        style={{
          boxShadow: checked
            ? "0 0 0 6px rgba(126,34,206,0.25)" // purple glow
            : "0 0 0 6px rgba(0,0,0,0.12)",     // gray glow
        }}
      />
      {/* knob */}
      <span
        className={`relative z-10 inline-block h-3 w-3 transform rounded-full bg-white shadow
          transition-transform duration-300
          ${checked ? "translate-x-5" : "translate-x-1"}`}
      />
    </button>
  );
}
