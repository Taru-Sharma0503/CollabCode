import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import Button from '../common/Button';

export default function ChatPanel({ messages = [], onSendMessage, currentUser }) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="h-full flex flex-col bg-bg-card border-l border-border text-text-main">
      <div className="flex items-center space-x-2 px-3 py-2 border-b border-border text-xs uppercase font-semibold text-text-muted">
        <MessageSquare className="w-4 h-4 text-accent" />
        <span>Workspace Chat</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-6">No messages yet. Say hello!</p>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.sender?.id === currentUser?.id;
            return (
              <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center space-x-1.5 text-[10px] text-text-muted mb-0.5">
                  <span className="font-semibold text-text-main">{isMe ? 'You' : m.sender?.name}</span>
                  <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div
                  className={`max-w-[85%] rounded-surface px-3 py-1.5 text-xs ${
                    isMe
                      ? 'bg-accent text-white rounded-tr-none'
                      : 'bg-bg-editor text-text-main border border-border rounded-tl-none'
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-2 border-t border-border flex items-center space-x-2 bg-bg-card">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-surface bg-bg-editor border border-border px-3 py-1.5 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
        />
        <Button type="submit" size="sm" variant="primary" icon={Send}>
          Send
        </Button>
      </form>
    </div>
  );
}
