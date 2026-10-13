import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { GreenApiService } from '../services/greenApi';
import { Message } from '../types';
import {
  Send,
  Check,
  CheckCheck,
  ArrowLeft,
  Loader2,
  Trash2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

interface ChatWindowProps {
  onBackMobile?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onBackMobile }) => {
  const credentials = useChatStore((s) => s.credentials);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const chats = useChatStore((s) => s.chats);
  const messagesByChat = useChatStore((s) => s.messages);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessageStatus = useChatStore((s) => s.updateMessageStatus);
  const deleteChat = useChatStore((s) => s.deleteChat);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);
  const messages = activeChatId ? messagesByChat[activeChatId] || [] : [];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Focus input on active chat change
  useEffect(() => {
    inputRef.current?.focus();
    setSendError(null);
  }, [activeChatId]);

  if (!activeChat || !activeChatId) {
    return (
      <main className="flex-1 h-full bg-[#0e1621] telegram-chat-pattern flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-full bg-[#17212b] border border-[#232e3c] flex items-center justify-center text-[#54a9eb] mb-4 shadow-xl">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-base font-semibold text-white mb-1">Выберите чат</h2>
        <p className="text-xs text-[#7f91a4] max-w-xs">
          Выберите собеседника из списка слева или начните новый диалог, чтобы отправить сообщение в Telegram
        </p>
      </main>
    );
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !credentials || isSending) return;

    setIsSending(true);
    setSendError(null);

    const tempMessageId = `out-${Date.now()}`;
    const outgoingMsg: Message = {
      id: tempMessageId,
      chatId: activeChatId,
      text,
      timestamp: Date.now(),
      direction: 'outgoing',
      status: 'sending',
    };

    // Optimistically add message
    addMessage(activeChatId, outgoingMsg);
    setInputText('');

    try {
      const api = new GreenApiService(credentials);
      const res = await api.sendMessage(activeChatId, text);

      if (res && res.idMessage) {
        updateMessageStatus(activeChatId, tempMessageId, 'sent');
      } else {
        updateMessageStatus(activeChatId, tempMessageId, 'sent');
      }
    } catch (err: any) {
      console.error('Send error:', err);
      setSendError(err.message || 'Ошибка отправки сообщения');
      updateMessageStatus(activeChatId, tempMessageId, 'failed');
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const formatMessageTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    const clean = name.replace(/^@/, '').trim();
    if (!clean) return 'TG';
    const parts = clean.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  return (
    <main className="flex-1 h-full bg-[#0e1621] telegram-chat-pattern flex flex-col min-w-0">
      {/* Chat Top Header */}
      <header className="h-16 px-4 bg-[#17212b] border-b border-[#101921] flex items-center justify-between z-10">
        <div className="flex items-center gap-3 min-w-0">
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="md:hidden p-2 -ml-2 text-[#7f91a4] hover:text-white rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-sm flex-shrink-0 ${
              activeChat.avatarColor || 'bg-blue-600'
            }`}
          >
            {getInitials(activeChat.name)}
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white truncate">
              {activeChat.name}
            </h2>
            <div className="text-[11px] text-[#7f91a4] truncate flex items-center gap-1.5">
              <span>Chat ID: {activeChat.id}</span>
              {activeChat.phoneNumber && <span>• {activeChat.phoneNumber}</span>}
              {activeChat.username && <span>• @{activeChat.username}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (confirm(`Удалить переписку с «${activeChat.name}»?`)) {
                deleteChat(activeChat.id);
              }
            }}
            title="Удалить чат"
            className="p-2 rounded-xl text-[#7f91a4] hover:text-rose-400 hover:bg-[#202b36] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Error alert if send failed */}
      {sendError && (
        <div className="px-4 py-2 bg-rose-500/15 border-b border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{sendError}</span>
          </div>
          <button
            onClick={() => setSendError(null)}
            className="text-xs hover:underline"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#7f91a4]">
            <div className="bg-[#17212b]/90 border border-[#232e3c] px-5 py-3 rounded-2xl max-w-sm text-xs shadow-lg">
              <p className="font-medium text-white mb-1">История сообщений пуста</p>
              <p className="text-[#7f91a4]">
                Напишите первое сообщение ниже. Оно будет отправлено получателю в Telegram через GREEN-API.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOutgoing = msg.direction === 'outgoing';

            return (
              <div
                key={msg.id}
                className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-3.5 py-2 relative shadow-md break-words ${
                    isOutgoing
                      ? 'bg-[#2b5278] text-white rounded-br-none'
                      : 'bg-[#182533] text-white rounded-bl-none border border-[#243343]/30'
                  }`}
                >
                  {!isOutgoing && msg.senderName && (
                    <div className="text-[11px] font-semibold text-[#54a9eb] mb-0.5">
                      {msg.senderName}
                    </div>
                  )}

                  <div className="text-sm leading-relaxed whitespace-pre-wrap select-text">
                    {msg.text}
                  </div>

                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
                      isOutgoing ? 'text-sky-200/70' : 'text-[#7f91a4]'
                    }`}
                  >
                    <span>{formatMessageTime(msg.timestamp)}</span>

                    {isOutgoing && (
                      <span className="inline-flex">
                        {msg.status === 'sending' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-sky-200" />
                        ) : msg.status === 'failed' ? (
                          <span title="Ошибка отправки"><AlertCircle className="w-3 h-3 text-rose-300" /></span>
                        ) : msg.status === 'read' ? (
                          <span title="Прочитано"><CheckCheck className="w-3.5 h-3.5 text-sky-200" /></span>
                        ) : (
                          <span title="Отправлено"><Check className="w-3.5 h-3.5 text-sky-200" /></span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bottom Bar */}
      <footer className="p-3 bg-[#17212b] border-t border-[#101921]">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Написать сообщение..."
              className="w-full bg-[#0e1621] border border-[#232e3c] rounded-2xl py-3 px-4 text-sm text-white placeholder-[#4e5d6e] focus:outline-none focus:border-[#2481cc] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            title="Отправить (Enter)"
            className="w-11 h-11 bg-[#2481cc] hover:bg-[#1e72b6] active:bg-[#1965a3] rounded-full flex items-center justify-center text-white transition-all shadow-md shadow-[#2481cc]/25 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 translate-x-0.5" />
            )}
          </button>
        </form>
      </footer>
    </main>
  );
};
