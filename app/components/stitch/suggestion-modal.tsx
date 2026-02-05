'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Youtube, Loader2, Link as LinkIcon } from "lucide-react";
import { submitSuggestion } from "@/app/admin/actions";
import { useAuth } from "@/lib/auth-context";

interface SuggestionModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SuggestionModal({ trigger, open: controlledOpen, onOpenChange }: SuggestionModalProps) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setIsLoading(true);

    try {
      const res = await submitSuggestion(url, user.id);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
          setUrl("");
        }, 2000);
      } else {
        setError(res.error || "Failed using default error");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  if (!isOpen) {
    if (trigger) {
      return (
        <div onClick={() => setIsOpen(true)} className="contents">
          {trigger}
        </div>
      );
    }

    // Only render default button if trigger is undefined (not explicitly null)
    if (trigger === undefined) {
      return (
        <Button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm rounded-xl px-4 py-2 font-bold cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> Suggest Video
        </Button>
      );
    }

    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Youtube className="w-6 h-6 text-red-600" />
          Suggest a Video
        </h2>

        {success ? (
          <div className="text-center py-8">
            <div className="bg-green-100 text-green-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Suggestion Submitted!</h3>
            <p className="text-gray-500 text-sm">Thanks for contributing. We'll review it shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-gray-500 text-sm mb-4">
              Found a great Authentic Food video on YouTube? Share it with us and we'll extract the restaurant details!
            </p>

            <div className="relative mb-4">
              <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="url"
                required
                placeholder="https://youtube.com/watch?v=..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-white cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...
                  </>
                ) : (
                  "Submit Suggestion"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
