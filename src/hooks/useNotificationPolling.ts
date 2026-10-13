import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { GreenApiService } from '../services/greenApi';
import { Message } from '../types';

export const useNotificationPolling = () => {
  const credentials = useChatStore((s) => s.credentials);
  const isAuthenticated = useChatStore((s) => s.isAuthenticated);
  const addMessage = useChatStore((s) => s.addMessage);
  const getOrCreateChat = useChatStore((s) => s.getOrCreateChat);
  const updateMessageStatus = useChatStore((s) => s.updateMessageStatus);
  const setIsPollingActive = useChatStore((s) => s.setIsPollingActive);
  const setLastPollError = useChatStore((s) => s.setLastPollError);

  const isRunningRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !credentials) {
      setIsPollingActive(false);
      return;
    }

    const apiService = new GreenApiService(credentials);
    let isCancelled = false;
    isRunningRef.current = true;
    setIsPollingActive(true);
    setLastPollError(null);

    const pollLoop = async () => {
      while (!isCancelled && isRunningRef.current) {
        try {
          const notification = await apiService.receiveNotification(5);

          if (isCancelled) break;

          if (notification && notification.receiptId) {
            const { receiptId, body } = notification;

            // Handle incoming text message
            if (body && body.typeWebhook === 'incomingMessageReceived') {
              const senderData = body.senderData || {};
              const messageData = body.messageData || {};

              const chatId = senderData.chatId || senderData.sender;
              const text =
                messageData.textMessageData?.textMessage ||
                messageData.extendedTextMessageData?.text ||
                (messageData.typeMessage ? `[Вложение: ${messageData.typeMessage}]` : '');

              if (chatId && text) {
                // Ensure chat exists
                const senderName = senderData.senderName || senderData.chatName || `Telegram ${chatId}`;
                getOrCreateChat(chatId, senderName, chatId);

                const msg: Message = {
                  id: body.idMessage || `inc-${Date.now()}-${receiptId}`,
                  chatId,
                  text,
                  timestamp: body.timestamp ? body.timestamp * 1000 : Date.now(),
                  direction: 'incoming',
                  senderName,
                  status: 'read',
                };

                addMessage(chatId, msg);
              }
            }

            // Handle message status updates (sent, delivered, read)
            if (body && (body.typeWebhook === 'statusMessage' || body.typeWebhook === 'outgoingMessageStatus')) {
              const statusData = body.statusData || {};
              const targetChatId = statusData.chatId;
              const targetMsgId = statusData.idMessage;
              const status = statusData.status;

              if (targetChatId && targetMsgId && status) {
                if (status === 'delivered') {
                  updateMessageStatus(targetChatId, targetMsgId, 'delivered');
                } else if (status === 'read') {
                  updateMessageStatus(targetChatId, targetMsgId, 'read');
                } else if (status === 'sent') {
                  updateMessageStatus(targetChatId, targetMsgId, 'sent');
                }
              }
            }

            // Always delete processed notification to free the FIFO queue
            await apiService.deleteNotification(receiptId);
            setLastPollError(null);
          }
        } catch (err: any) {
          if (isCancelled) break;
          console.warn('Polling error:', err);
          setLastPollError(err.message || 'Ошибка получения уведомлений');
          // Wait 3 seconds on error before retry to avoid throttling
          await new Promise((res) => setTimeout(res, 3000));
        }

        // Brief idle pause between polls
        if (!isCancelled) {
          await new Promise((res) => setTimeout(res, 500));
        }
      }
    };

    pollLoop();

    return () => {
      isCancelled = true;
      isRunningRef.current = false;
      setIsPollingActive(false);
    };
  }, [
    credentials,
    isAuthenticated,
    addMessage,
    getOrCreateChat,
    updateMessageStatus,
    setIsPollingActive,
    setLastPollError,
  ]);
};
