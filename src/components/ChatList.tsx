import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import {
  Search,
  Plus,
  Settings,
  LogOut,
  Radio,
  Check,
  CheckCheck,
  Trash2,
  MessageSquareDashed,
} from 'lucide-react';

interface ChatListProps {
  onOpenNewChat: () => void;
  onOpenSettings: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({ onOpenNewChat, onOpenSettings }) => {
  const credentials = useChatStore((s) => s.credentials);
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const isPollingActive = useChatStore((s) => s.isPollingActive);
  const logout = useChatStore((s) => s.logout);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter((chat) => {
    const q = searchQuery.toLowerCase();
    return (
      chat.name.toLowerCase().includes(q) ||
      chat.id.toLowerCase().includes(q) ||
      (chat.phoneNumber && chat.phoneNumber.includes(q)) ||
      (chat.username && chat.username.toLowerCase().includes(q)) ||
      (chat.lastMessage?.text && chat.lastMessage.text.toLowerCase().includes(q))
    );
  });

  const getInitials = (name: string) => {
    const clean = name.replace(/^@/, '').trim();
    if (!clean) return 'TG';
    const parts = clean.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  const isMax = credentials?.messengerType === 'max';

  return (
    <aside className="w-80 md:w-96 h-full bg-[#17212b] border-r border-[#101921] flex flex-col select-none flex-shrink-0">
      {/* Top Header */}
      <div className="p-3.5 border-b border-[#101921] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-inner ${
                isMax ? 'bg-purple-600' : 'bg-[#2481cc]'
              }`}
            >
              {isMax ? 'MAX' : 'TG'}
            </div>
            {isPollingActive && (
              <span
                title="Служба приёма сообщений активна (Long Polling)"
                className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#17212b] rounded-full"
              />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white truncate">
              {isMax ? 'MAX Messenger' : 'Telegram Web'}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-[#7f91a4]">
              <span className="truncate">id: {credentials?.idInstance}</span>
              <span className="text-emerald-400 flex items-center gap-0.5">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                Live
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNewChat}
            title="Новый чат"
            className="p-2 rounded-xl text-[#7f91a4] hover:text-[#54a9eb] hover:bg-[#202b36] transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenSettings}
            title="Настройки инстанса"
            className="p-2 rounded-xl text-[#7f91a4] hover:text-white hover:bg-[#202b36] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            title="Выйти"
            className="p-2 rounded-xl text-[#7f91a4] hover:text-rose-400 hover:bg-[#202b36] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#7f91a4] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск сообщений и чатов..."
            className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-[#4e5d6e] focus:outline-none focus:border-[#2481cc] transition-colors"
          />
        </div>
      </div>

      {/* Chat List Body */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#7f91a4]">
            <div className="w-14 h-14 rounded-2xl bg-[#202b36] flex items-center justify-center text-[#54a9eb] mb-3">
              <MessageSquareDashed className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-medium text-white mb-1">Нет активных чатов</h3>
            <p className="text-xs text-[#7f91a4] max-w-[200px] mb-4">
              Нажмите кнопку ниже, чтобы начать переписку по номеру телефона
            </p>
            <button
              onClick={onOpenNewChat}
              className="px-4 py-2 bg-[#2481cc] hover:bg-[#1e72b6] text-white text-xs font-medium rounded-xl transition-all shadow-md shadow-[#2481cc]/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Создать первый чат</span>
            </button>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#7f91a4]">
            Ничего не найдено по запросу «{searchQuery}»
          </div>
        ) : (
          <div className="divide-y divide-[#101921]/50">
            {filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const lastMsg = chat.lastMessage;
              const isOutgoing = lastMsg?.direction === 'outgoing';

              return (
                <div
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`group relative flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#2b5278] text-white'
                      : 'hover:bg-[#202b36] text-white/90'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold text-white shadow-sm ${
                      chat.avatarColor || 'bg-blue-600'
                    }`}
                  >
                    {getInitials(chat.name)}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-medium text-sm text-white truncate">
                        {chat.name}
                      </span>
                      <span className="text-[11px] text-[#7f91a4] flex-shrink-0">
                        {formatTime(lastMsg?.timestamp || chat.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-[#7f91a4] truncate flex items-center gap-1">
                        {isOutgoing && (
                          <span className="flex-shrink-0 text-sky-300">
                            {lastMsg?.status === 'read' ? (
                              <CheckCheck className="w-3.5 h-3.5 inline" />
                            ) : (
                              <Check className="w-3.5 h-3.5 inline" />
                            )}
                          </span>
                        )}
                        <span className="truncate">
                          {lastMsg ? lastMsg.text : 'Чат создан'}
                        </span>
                      </p>

                      {chat.unreadCount && chat.unreadCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#2481cc] text-white text-[11px] font-bold flex-shrink-0">
                          {chat.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Delete button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Удалить чат с «${chat.name}»?`)) {
                        deleteChat(chat.id);
                      }
                    }}
                    title="Удалить чат"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#7f91a4] hover:text-rose-400 hover:bg-black/20 transition-all absolute right-2 top-3"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
