'use client';

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import AdminDashboard from "./admin-client";
import { supabase } from "@/lib/supabase";

export default function AdminPageProtection() {
  const { user, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      checkAdmin();
    } else if (!isLoading) {
      setIsAdmin(false);
    }
  }, [user, isLoading]);

  const checkAdmin = async () => {
    // We can just check the profile role directly
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single();

    if (data && data.role === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  if (isLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAdmin) {
    // Render a 404-like page
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-6xl font-black text-gray-200 mb-4">404</h1>
          <p className="text-xl text-gray-600 font-medium">Page Not Found</p>
          <p className="text-gray-400 mt-2">The page you are looking for does not exist.</p>
          <a href="/" className="mt-8 inline-block text-primary hover:underline font-bold">Go Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[#1c1917]">Admin Dashboard</h1>
        <AdminDashboard />
      </div>
    </div>
  );
}
