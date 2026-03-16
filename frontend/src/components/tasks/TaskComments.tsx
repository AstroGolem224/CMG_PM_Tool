/** Comments list and input for a task */
import { useState, useEffect, useCallback } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { commentsApi } from '@/api/comments';
import ErrorBanner from '@/components/common/ErrorBanner';
import { formatRelativeTime } from '@/lib/utils';
import type { Comment } from '@/types';

interface TaskCommentsProps {
  taskId: string;
  disabled?: boolean;
}

export default function TaskComments({ taskId, disabled = false }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const data = await commentsApi.listByTask(taskId);
      setComments(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await commentsApi.create({ task_id: taskId, content: newComment.trim() });
      setNewComment('');
      setError(null);
      fetchComments();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={14} className="text-[var(--accent-primary)]" />
        <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
          Comments ({comments.length})
        </label>
      </div>
      {error && <ErrorBanner message={error} />}

      {/* Comments list */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="py-4 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            no comments logged
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="surface-subtle p-3"
            >
              <p className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">
                {comment.content}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {formatRelativeTime(comment.created_at)}
              </p>
            </div>
          ))
        )}
      </div>

      {/* New comment input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          disabled={disabled}
          className="control-shell flex-1 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={disabled || !newComment.trim() || loading}
          className="button-primary rounded-lg p-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send comment"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
