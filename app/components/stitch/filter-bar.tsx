"use client";

import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleFilterClick = (filter: string) => {
    if (filter === "All") {
      router.push("/collections");
    } else {
      router.push(`/collections?tag=${encodeURIComponent(filter)}`);
    }
  };

  return (
    <div className="sticky top-[80px] z-40 bg-[#fafaf9] py-4 mb-8">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilterClick(filter)}
            className="px-6 py-2 rounded-full font-medium text-sm transition-colors whitespace-nowrap bg-white border border-gray-200 text-[#1c1917] hover:border-primary hover:text-primary"
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}
