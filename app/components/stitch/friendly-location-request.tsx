"use client";

import React, { useState, useEffect } from "react";
import { MapPin, X, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/lib/location-context";
import { useLanguage } from "@/lib/i18n-context";

export function FriendlyLocationRequest() {
  const { permissionStatus, requestLocation } = useLocation();
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show only if status is prompt AND we haven't dismissed it in this session
    // (Local per-session toggle could be added if needed)
    if (permissionStatus === "prompt") {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [permissionStatus]);

  if (!isVisible || permissionStatus === "granted" || permissionStatus === "denied") {
    return null;
  }

  const handleAllow = async () => {
    await requestLocation();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-32px)] max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl p-5 md:p-6 overflow-hidden relative">
        {/* Subtle background pattern/blob */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-xl shrink-0">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg mb-1 leading-tight">
              {language === 'vi' ? 'Tìm quán ngon gần bạn?' : 'Find spots nearby?'}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              {language === 'vi'
                ? 'Cho phép truy cập vị trí để xem khoảng cách từ bạn đến những quán ăn ngon tại Đà Nẵng.'
                : 'Allow location access to see the distance to authentic restaurants around you in Da Nang.'}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleAllow}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-11 cursor-pointer"
              >
                {language === 'vi' ? 'Cho phép' : 'Allow Access'}
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                className="font-semibold text-gray-500 hover:bg-gray-50 rounded-xl cursor-pointer"
              >
                {language === 'vi' ? 'Để sau' : 'Not now'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
