"use client";

import Link from "next/link";
import { MapPin, ChevronDown, Heart, LogIn, LogOut, PlusCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { LoginModal } from "@/components/auth/login-modal";
import { SuggestionModal } from "@/components/stitch/suggestion-modal";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);

  return (
    <>
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

          <div className="flex items-center gap-3">
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

            {/* Auth Actions */}
            {user ? (
              <div className="relative pl-3 border-l border-gray-200">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full border border-gray-200 hover:shadow-md transition-shadow cursor-pointer bg-white"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-gray-100">
                    {user.user_metadata.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-xs text-primary">{user.email?.[0].toUpperCase()}</span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-3 border-b border-gray-100">
                        <p className="font-bold text-sm text-gray-900 truncate">{user.user_metadata.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/me/favorites"
                          className="flex items-center gap-3 w-full p-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Heart className="w-4 h-4" />
                          My Collection
                        </Link>

                        <button
                          className="flex items-center gap-3 w-full p-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-left"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setIsSuggestionModalOpen(true);
                          }}
                        >
                          <PlusCircle className="w-4 h-4" />
                          Suggest Video
                        </button>

                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            signOut();
                          }}
                          className="flex items-center gap-3 w-full p-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button
                onClick={() => setIsLoginModalOpen(true)}
                variant="ghost"
                className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-primary hover:bg-transparent cursor-pointer"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <SuggestionModal
        trigger={null}
        open={isSuggestionModalOpen}
        onOpenChange={setIsSuggestionModalOpen}
      />
    </>
  );
}
