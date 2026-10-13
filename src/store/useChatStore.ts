import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chat, GreenApiCredentials, Message, MessageStatus } from '../types';

interface ChatStoreState {
  credentials: GreenApiCredentials | null;
  isAuthenticated: boolean;
  instanceState: string | null;
  activeChatId: string | null;
  chats: Chat[];
  messages: Record<string, Message[]>; // Keyed by chatId
  isPollingActive: boolean;
  lastPollError: string | null;

  // Actions
  setCredentials: (credentials: GreenApiCredentials | null) => void;
  setInstanceState: (state: string | null) => void;
  logout: () => void;
  setActiveChatId: (chatId: string | null) => void;
  addChat: (chat: Chat) => void;
  deleteChat: (chatId: string) => void;
  getOrCreateChat: (chatId: string, name?: string, contact?: string) => Chat;
  addMessage: (chatId: string, message: Message) => void;
  updateMessageStatus: (chatId: string, messageId: string, status: MessageStatus) => void;
  setIsPollingActive: (active: boolean) => void;
  setLastPollError: (error: string | null) => void;
}

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-indigo-600',
];

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
      credentials: null,
      isAuthenticated: false,
      instanceState: null,
      activeChatId: null,
      chats: [],
      messages: {},
      isPollingActive: false,
      lastPollError: null,

      setCredentials: (credentials) => {
        set({
          credentials,
          isAuthenticated: Boolean(credentials?.idInstance && credentials?.apiTokenInstance),
        });
      },

      setInstanceState: (state) => set({ instanceState: state }),

      logout: () => {
        set({
          credentials: null,
          isAuthenticated: false,
          instanceState: null,
          activeChatId: null,
          isPollingActive: false,
          lastPollError: null,
        });
      },

      setActiveChatId: (chatId) => {
        set((state) => {
          // Reset unread count for the active chat
          if (chatId) {
            const updatedChats = state.chats.map((c) =>
              c.id === chatId ? { ...c, unreadCount: 0 } : c
            );
            return { activeChatId: chatId, chats: updatedChats };
          }
          return { activeChatId: chatId };
        });
      },

      addChat: (newChat) => {
        set((state) => {
          const exists = state.chats.some((c) => c.id === newChat.id);
          if (exists) {
            return {
              activeChatId: newChat.id,
              chats: state.chats.map((c) => (c.id === newChat.id ? { ...c, ...newChat } : c)),
            };
          }
          const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
          const chatWithAvatar = {
            ...newChat,
            avatarColor: newChat.avatarColor || randomColor,
          };
          return {
            chats: [chatWithAvatar, ...state.chats],
            activeChatId: newChat.id,
          };
        });
      },

      deleteChat: (chatId) => {
        set((state) => {
          const updatedChats = state.chats.filter((c) => c.id !== chatId);
          const updatedMessages = { ...state.messages };
          delete updatedMessages[chatId];
          return {
            chats: updatedChats,
            messages: updatedMessages,
            activeChatId: state.activeChatId === chatId ? (updatedChats[0]?.id ?? null) : state.activeChatId,
          };
        });
      },

      getOrCreateChat: (chatId, name, contact) => {
        const state = get();
        const existing = state.chats.find((c) => c.id === chatId);
        if (existing) {
          return existing;
        }

        const isPhone = contact && /^\+?\d+$/.test(contact.replace(/\s+/g, ''));
        const displayName = name || contact || `Чат ${chatId}`;
        const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

        const newChat: Chat = {
          id: chatId,
          name: displayName,
          phoneNumber: isPhone ? contact : undefined,
          username: !isPhone && contact ? contact.replace(/^@/, '') : undefined,
          avatarColor: randomColor,
          unreadCount: 0,
          createdAt: Date.now(),
        };

        set((s) => ({
          chats: [newChat, ...s.chats],
        }));

        return newChat;
      },

      addMessage: (chatId, message) => {
        set((state) => {
          const currentList = state.messages[chatId] || [];
          // Avoid duplicate messages with identical id
          if (currentList.some((m) => m.id === message.id)) {
            return state;
          }

          const updatedList = [...currentList, message];
          const isCurrentActive = state.activeChatId === chatId;

          // Update lastMessage and unread count in chat
          const updatedChats = state.chats.map((chat) => {
            if (chat.id === chatId) {
              const unread = isCurrentActive || message.direction === 'outgoing'
                ? 0
                : (chat.unreadCount || 0) + 1;
              return {
                ...chat,
                lastMessage: message,
                unreadCount: unread,
              };
            }
            return chat;
          });

          // Sort chats so recent chat appears first
          updatedChats.sort((a, b) => {
            const timeA = a.lastMessage?.timestamp || a.createdAt;
            const timeB = b.lastMessage?.timestamp || b.createdAt;
            return timeB - timeA;
          });

          return {
            messages: {
              ...state.messages,
              [chatId]: updatedList,
            },
            chats: updatedChats,
          };
        });
      },

      updateMessageStatus: (chatId, messageId, status) => {
        set((state) => {
          const currentList = state.messages[chatId] || [];
          const updatedList = currentList.map((m) =>
            m.id === messageId ? { ...m, status } : m
          );
          return {
            messages: {
              ...state.messages,
              [chatId]: updatedList,
            },
          };
        });
      },

      setIsPollingActive: (active) => set({ isPollingActive: active }),
      setLastPollError: (error) => set({ lastPollError: error }),
    }),
    {
      name: 'green-api-telegram-storage',
      partialize: (state) => ({
        credentials: state.credentials,
        isAuthenticated: state.isAuthenticated,
        chats: state.chats,
        messages: state.messages,
        activeChatId: state.activeChatId,
      }),
    }
  )
);
