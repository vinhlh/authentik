"use client";

import { X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function LoginModal({ isOpen, onClose, message = "Sign in to save your favorite spots" }: LoginModalProps) {
  const { signInWithGoogle, signInWithApple, user } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (user && isOpen) {
      onClose();
    }
  }, [user, isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-[400px] bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 transform ${isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <img src="/icon-mark.png" alt="Logo" className="w-10 h-10 object-contain" />
          </div>

          <h2 className="text-2xl font-bold text-[#1c1917] mb-2">Welcome to Authentik</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            {message}
          </p>

          <div className="space-y-3">
            <Button
              className="w-full h-12 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-3 transition-all shadow-sm cursor-pointer"
              onClick={() => signInWithGoogle()}
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
              Continue with Google
            </Button>

            <Button
              className="w-full h-12 bg-black text-white hover:bg-gray-800 font-bold rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-black/10 cursor-pointer"
              onClick={() => signInWithApple()}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.36-1.07-.53-2.04-.53-3.08 0-1.4.74-2.1.53-3.1-.48-1.74-1.78-2.9-4.57-1.18-7.53 1.05-1.75 2.65-2.06 3.61-1.85 1.02.19 1.95 1 2.5 1 .6 0 1.87-.9 3.09-.9 2.05-.07 3.25 1.05 3.75 1.76-3.23 1.87-2.67 5.75.92 7.14-.65 1.83-1.6 3.63-2.93 4.88-.47.46-1 .85-1.5.5zM12 4.43c-.15 1.88 1.35 3.32 2.85 3.32 1.5 0 2.25-1.35 2.25-3.32-.15-2.1-1.65-3.32-3-3.32-1.65 0-2.4 1.35-2.1 3.32z" />
              </svg>
              Continue with Apple
            </Button>
          </div>

          <p className="mt-8 text-xs text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
