import React, { useState } from 'react';
import { MessageCircle, CheckCircle, RotateCcw, Reply, Plus, Trash2 } from 'lucide-react';
import Button from '../common/Button';

export default function CommentsPanel({
  comments = [],
  activeFile,
  onCreateComment,
  onReplyComment,
  onResolveComment,
  onReopenComment,
  onDeleteComment
}) {
  const [filter, setFilter] = useState('all'); // 'all', 'open', 'resolved'
  const [newCommentBody, setNewCommentBody] = useState('');
  const [replyBodies, setReplyBodies] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);

  const filteredComments = comments.filter((c) => {
    if (filter === 'open') return c.status === 'open';
    if (filter === 'resolved') return c.status === 'resolved';
    return true;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newCommentBody.trim() || !activeFile) return;

    onCreateComment({
      fileId: activeFile.id,
      body: newCommentBody.trim(),
      anchor: { start: 0, end: 10 }
    });
    setNewCommentBody('');
  };

  const handleReplySubmit = (commentId) => {
    const text = replyBodies[commentId];
    if (!text || !text.trim()) return;

    onReplyComment(commentId, text.trim());
    setReplyBodies((prev) => ({ ...prev, [commentId]: '' }));
    setActiveReplyId(null);
  };

  return (
    <div className="h-full flex flex-col bg-bg-card border-l border-border text-text-main">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border text-xs uppercase font-semibold text-text-muted">
        <div className="flex items-center space-x-1.5">
          <MessageCircle className="w-4 h-4 text-accent" />
          <span>Comments</span>
        </div>
        <div className="flex items-center space-x-1">
          {['all', 'open', 'resolved'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded text-[10px] capitalize transition-colors ${
                filter === f ? 'bg-accent/20 text-accent font-semibold' : 'text-text-muted hover:text-text-main'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredComments.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-6">No {filter} comments found.</p>
        ) : (
          filteredComments.map((c) => (
            <div
              key={c.id}
              className={`rounded-surface p-3 border text-xs space-y-2 transition-all ${
                c.status === 'resolved'
                  ? 'bg-bg-main/30 border-border/40 opacity-70'
                  : 'bg-bg-editor border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-text-main">{c.author?.name}</span>
                  <span className="text-[10px] text-text-muted">
                    {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {c.status === 'open' ? (
                    <button
                      onClick={() => onResolveComment(c.id)}
                      title="Resolve"
                      className="p-1 text-text-muted hover:text-success"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onReopenComment(c.id)}
                      title="Reopen"
                      className="p-1 text-text-muted hover:text-warning"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteComment(c.id)}
                    title="Delete"
                    className="p-1 text-text-muted hover:text-error"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-text-main">{c.body}</p>

              {/* Replies */}
              {c.replies?.length > 0 && (
                <div className="pl-3 border-l-2 border-border space-y-2 pt-1">
                  {c.replies.map((r, rIdx) => (
                    <div key={r.id || rIdx} className="space-y-0.5">
                      <div className="flex items-center space-x-1.5 text-[10px] text-text-muted">
                        <span className="font-semibold text-text-main">{r.author?.name}</span>
                        <span>{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-text-main text-xs">{r.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply box */}
              {activeReplyId === c.id ? (
                <div className="pt-2 flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={replyBodies[c.id] || ''}
                    onChange={(e) =>
                      setReplyBodies((prev) => ({ ...prev, [c.id]: e.target.value }))
                    }
                    placeholder="Write a reply..."
                    className="flex-1 rounded bg-bg-main border border-border px-2 py-1 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
                  />
                  <Button size="sm" onClick={() => handleReplySubmit(c.id)}>
                    Reply
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveReplyId(c.id)}
                  className="flex items-center space-x-1 text-[11px] text-accent hover:underline pt-1"
                >
                  <Reply className="w-3 h-3" />
                  <span>Reply</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleCreate} className="p-3 border-t border-border bg-bg-card space-y-2">
        <textarea
          rows={2}
          value={newCommentBody}
          onChange={(e) => setNewCommentBody(e.target.value)}
          placeholder={`Add a comment on ${activeFile ? activeFile.name : 'this file'}...`}
          className="w-full rounded-surface bg-bg-editor border border-border p-2 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent resize-none"
        />
        <Button
          type="submit"
          size="sm"
          variant="primary"
          icon={Plus}
          disabled={!newCommentBody.trim() || !activeFile}
          className="w-full"
        >
          Post Comment
        </Button>
      </form>
    </div>
  );
}
