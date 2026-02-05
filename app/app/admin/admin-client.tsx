'use client';

import { useEffect, useState } from "react";
import { approveSuggestion, rejectSuggestion, reprocessSuggestion } from "./actions";
import { CheckCircle, XCircle, Loader2, ExternalLink, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

// Admin Client Component
export default function AdminDashboard() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin_suggestions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'video_suggestions' },
        (payload) => {
          fetchSuggestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSuggestions = async () => {
    const { data } = await supabase
      .from('video_suggestions')
      .select(`
        *,
        profiles:user_id (email, full_name)
      `)
      .order('created_at', { ascending: false });

    if (data) setSuggestions(data);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    const res = await approveSuggestion(id);
    if (!res.success) {
      alert("Error: " + res.error);
    }
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject this suggestion?")) return;
    const res = await rejectSuggestion(id);
    if (!res.success) {
      alert("Error: " + res.error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (loading) return <div className="p-12 text-center">Loading...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-900">Date</th>
              <th className="px-6 py-4 font-semibold text-gray-900">User</th>
              <th className="px-6 py-4 font-semibold text-gray-900">URL</th>
              <th className="px-6 py-4 font-semibold text-gray-900">Status</th>
              <th className="px-6 py-4 font-semibold text-gray-900 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {suggestions.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{s.profiles?.full_name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{s.profiles?.email}</div>
                </td>
                <td className="px-6 py-4">
                  <a
                    href={s.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 max-w-[500px] truncate"
                  >
                    {s.youtube_url} <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(s.status)}`}>
                    {s.status.toUpperCase()}
                  </span>
                  {s.status === 'completed' && s.result_collection_id && (
                    <div className="mt-1">
                      <a href={`/collections/${s.result_collection_id}`} target="_blank" className="text-xs text-blue-600 hover:underline">
                        View Result
                      </a>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {s.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(s.id)}
                          disabled={!!processingId}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {processingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(s.id)}
                          disabled={!!processingId}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {s.status !== 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!confirm("Force re-process this suggestion? This will overwrite existing data.")) return;
                          setProcessingId(s.id);
                          const res = await reprocessSuggestion(s.id);
                          if (!res.success) alert("Error: " + res.error);
                          setProcessingId(null);
                        }}
                        disabled={!!processingId}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 shadow-sm cursor-pointer hover:border-blue-300"
                        title="Force Reprocess (Collection + Images)"
                      >
                        {processingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </Button>
                    )}
                    {s.logs && Object.keys(s.logs).length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-900 cursor-pointer hover:bg-gray-100"
                        title="View Execution Logs"
                        onClick={() => alert(JSON.stringify(s.logs, null, 2))}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {suggestions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No suggestions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
