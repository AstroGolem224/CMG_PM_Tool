/** Comments list and input for a task */
import { useState, useEffect, useCallback } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { commentsApi } from '@/api/comments';
import { formatRelativeTime } from '@/lib/utils';
import type { Comment } from '@/types';

interface TaskCommentsProps {
  taskId: string;
}

export default function TaskComments({ taskId }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const data = await commentsApi.listByTask(taskId);
      setComments(data);
    } catch {
      // Silently fail
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
      fetchComments();
    } catch {
      // Error handled elsewhere
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={14} className="text-gray-400" />
        <label className="text-xs font-medium text-gray-400">
          Comments ({comments.length})
        </label>
      </div>

      {/* Comments list */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-4">
            No comments yet. Be the first to comment.
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-3 rounded-lg bg-white/[0.03] border border-white/5"
            >
              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                {comment.content}
              </p>
              <p className="text-[10px] text-gray-600 mt-2">
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
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || loading}
          className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Send comment"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
