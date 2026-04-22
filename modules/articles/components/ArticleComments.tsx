"use client";

import { useState } from 'react';
import { MessageSquare, Send, User, Calendar, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ArticleComment } from '../types';

interface ArticleCommentsProps {
  comments: ArticleComment[];
  onAddComment: (content: string) => Promise<void>;
}

export function ArticleComments({ comments, onAddComment }: ArticleCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
      toastSuccess("Kommentar wurde hinzugefügt.");
    } catch (err: any) {
      toastError(err.message || "Fehler beim Senden.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-5 h-5 text-slate-600" />
        <h3 className="text-lg font-bold tracking-wide text-slate-900">Kommentare ({comments.length})</h3>
      </div>

      <form onSubmit={handleSubmit} className="relative group">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Schreibe einen Kommentar oder eine Notiz zum Artikel..."
          className="block w-full rounded-2xl border-0 py-4 px-5 text-slate-900 bg-slate-50 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-accent sm:text-sm transition-all pr-14 placeholder-slate-400 font-medium"
          rows={2}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="absolute right-3 bottom-3 p-2 bg-accent text-white rounded-3xl hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-md border border-slate-200"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>

      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-500 text-sm font-semibold">Keine Kommentare vorhanden.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-8 p-8 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-3xl bg-indigo-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-accent" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-500">BENUTZER</span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {new Date(comment.created_at).toLocaleString('de-DE', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
