import React from 'react';
import { useChatStore } from './store/useChatStore';
import { useNotificationPolling } from './hooks/useNotificationPolling';
import { AuthScreen } from './components/AuthScreen';
import { ChatLayout } from './components/ChatLayout';

export const App: React.FC = () => {
  const isAuthenticated = useChatStore((s) => s.isAuthenticated);

  // Activates long-polling of HTTP API notifications when authenticated
  useNotificationPolling();

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <ChatLayout />;
};

export default App;
