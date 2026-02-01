'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Module-level variable to track processed codes across re-renders (Strict Mode)
let lastCode = '';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // 1. Handle upstream errors (e.g. invalid config, user cancel)
      if (error) {
        console.error('Auth error:', error, errorDescription);
        setErrorMsg(errorDescription || error);
        // Redirect after delay
        setTimeout(() => router.push('/'), 4000);
        return;
      }

      // 2. Handle success code exchange
      if (code) {
        // Prevent Strict Mode double-invocation
        if (code === lastCode) return;
        lastCode = code;

        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('Exchange error:', exchangeError);
            setErrorMsg(exchangeError.message);
            setTimeout(() => router.push('/'), 4000);
          } else {
            // Success!
            // Clear code from URL by redirecting
            router.push('/');
          }
        } catch (err) {
          console.error('Unexpected error:', err);
          router.push('/');
        }
      } else {
        // No code, no error. Likely a stray navigation or sticky session.
        router.push('/');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
        {errorMsg ? (
          <>
            <div className="text-red-500 font-bold mb-2">Authentication Failed</div>
            <p className="text-gray-600 mb-4 text-sm break-words leading-relaxed">{errorMsg}</p>
            <p className="text-xs text-gray-400">Redirecting to home...</p>
          </>
        ) : (
          <>
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
