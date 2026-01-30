import Link from "next/link";
import { Search, Heart, Menu, User, MapPin, ChevronDown } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#fafaf9]/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
        <div className="flex items-center gap-8">
          {/* Logo */}
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {/* <Utensils className="text-primary w-8 h-8" strokeWidth={2.5} />
            <h1 className="text-primary text-2xl font-bold tracking-tight">
              Authentik
            </h1> */}
            <img
              src="/logo.png"
              alt="Authentik"
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* City Switcher */}
          <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-full cursor-pointer hover:border-primary hover:text-primary transition-colors">
            <MapPin className="w-4 h-4" />
            <span>Da Nang</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </div>
        </div>

        {/* Search Bar */}
        {/* <div className="flex-1 max-w-xl hidden md:block">
          <label className="relative flex items-center w-full">
            <Search className="absolute left-4 text-gray-400 w-5 h-5" />
            <input
              className="w-full h-12 pl-12 pr-4 bg-white border-none rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 text-base placeholder:text-gray-400 outline-none"
              placeholder="Find local favorites in Da Nang..."
              type="text"
            />
          </label>
        </div> */}

        {/* User Actions */}
        {/* <div className="flex items-center gap-4 shrink-0">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Heart className="w-6 h-6 text-gray-600" />
          </button>
          <button className="flex items-center gap-2 p-1.5 pl-3 border border-gray-200 rounded-full hover:shadow-md transition-shadow bg-white">
            <Menu className="w-5 h-5 text-gray-600" />
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
          </button>
        </div> */}
      </div>
    </header>
  );
}
