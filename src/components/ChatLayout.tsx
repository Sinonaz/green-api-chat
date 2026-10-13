import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';
import { NewChatModal } from './NewChatModal';
import { SettingsModal } from './SettingsModal';

export const ChatLayout: React.FC = () => {
  const activeChatId = useChatStore((s) => s.activeChatId);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0e1621]">
      {/* Sidebar: Visible on desktop or when no chat selected on mobile */}
      <div
        className={`${
          activeChatId ? 'hidden md:flex' : 'flex'
        } h-full flex-shrink-0 w-full md:w-auto`}
      >
        <ChatList
          onOpenNewChat={() => setIsNewChatOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Main chat window: Visible on desktop or when chat selected on mobile */}
      <div
        className={`${
          activeChatId ? 'flex' : 'hidden md:flex'
        } flex-1 h-full min-w-0`}
      >
        <ChatWindow onBackMobile={() => setActiveChatId(null)} />
      </div>

      {/* Modals */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
