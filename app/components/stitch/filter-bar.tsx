"use client";

import { useState } from "react";

const FILTERS = [
  "All",
  "Breakfast",
  "Coffee",
  "Seafood",
  "Cheap Eats",
  "Dinner",
  "Street Food",
];

export function FilterBar() {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className="sticky top-[80px] z-40 bg-[#fafaf9] py-4 mb-8">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-6 py-2 rounded-full font-medium text-sm transition-colors whitespace-nowrap ${activeFilter === filter
              ? "bg-primary text-white"
              : "bg-white border border-gray-200 text-[#1c1917] hover:border-primary"
              }`}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}
