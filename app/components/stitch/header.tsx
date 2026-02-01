"use client";

import Link from "next/link";
import { MapPin, ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n-context";

export function Header() {
  const { language, setLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-50 bg-[#fafaf9]/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/logo.png"
              alt="Authentik"
              className="h-8 w-auto object-contain hidden md:block"
            />
            <img
              src="/icon-mark.png"
              alt="Authentik"
              className="h-8 w-8 object-contain md:hidden"
            />
          </Link>

          {/* City Switcher */}
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-full cursor-pointer hover:border-primary hover:text-primary transition-colors">
            <MapPin className="w-4 h-4" />
            <span className="md:hidden">DN</span>
            <span className="hidden md:inline">Da Nang</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </div>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
          <button
            onClick={() => setLanguage('vi')}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${language === 'vi'
              ? 'bg-white text-black shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            VI
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${language === 'en'
              ? 'bg-white text-black shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
}
