'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Search } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RAGChatProps {
  taskId: string;
}

export default function RAGChat({ taskId }: RAGChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    const userMsg: Message = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/rag-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          question,
          chatHistory: messages,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Ошибка подключения. Попробуйте позже.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isNoInfoAnswer = (text: string) =>
    text.includes('Организатор') && (text.includes('не указал') || text.includes('не упомянул'));

  return (
    <div className="floating-widget">
      {/* Toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-pulse-glow"
        >
          <MessageCircle className="w-6 h-6 text-midnight-950" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="w-96 h-[500px] glass-card flex flex-col animate-slide-up shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sun-500/20 flex items-center justify-center">
                <Search className="w-4 h-4 text-sun-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">RAG Консультант</h3>
                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                  🔍 Отвечаю только по описанию задачи
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8 animate-fade-in">
                <Bot className="w-10 h-10 text-sun-400/40 mx-auto mb-3" />
                <p className="text-xs text-gray-500">
                  Задайте вопрос о задаче — я отвечу на основе информации от организатора.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start gap-1.5 max-w-[85%]">
                  {msg.role === 'assistant' && (
                    <Bot className="w-5 h-5 text-sun-400 flex-shrink-0 mt-1" />
                  )}
                  <div
                    className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'chat-bubble-user ml-auto'
                        : isNoInfoAnswer(msg.content)
                          ? 'bg-gray-800/60 border border-gray-700/50 text-gray-400 italic'
                          : 'chat-bubble-ai'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <User className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-400 animate-fade-in">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sun-400" />
                Ищу в описании задачи...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Спросите о задаче..."
                className="input-field !py-2 !text-xs flex-1"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="btn-primary !px-3 !py-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
