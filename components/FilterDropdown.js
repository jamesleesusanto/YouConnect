import { useRef, useEffect, useState } from "react";

export default function FilterDropdown({ label, options, selected, setSelected }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Handle selection
  function handleCheck(option) {
    if (selected.includes(option)) {
      setSelected(selected.filter(x => x !== option));
    } else {
      setSelected([...selected, option]);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="bg-purple-700 hover:bg-purple-800 cursor-pointer text-sm text-white font-bold px-4.5 py-2 rounded-full text-base mr-1"
        type="button"
      >
        {label}
      </button>
      {open && (
        <div className="absolute mt-2 bg-white rounded-lg shadow-xl p-3 z-20 min-w-[180px] text-gray-700">
          {options.map(option => (
            <label className="flex items-center py-1 px-2 cursor-pointer hover:bg-purple-50 rounded" key={option}>
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => handleCheck(option)}
                className="mr-2 accent-purple-700"
              />
              <span className="text-sm font-semibold">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
