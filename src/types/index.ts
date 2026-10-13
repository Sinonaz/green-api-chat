export interface GreenApiCredentials {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string;
}

export type MessageDirection = 'incoming' | 'outgoing';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  chatId: string;
  text: string;
  timestamp: number;
  direction: MessageDirection;
  status?: MessageStatus;
  senderName?: string;
}

export interface Chat {
  id: string; // Target chatId (e.g. numeric ID, phone number, or Telegram identifier)
  name: string; // Display name or formatted phone / username
  phoneNumber?: string;
  username?: string;
  avatarColor?: string;
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: number;
}

export interface ReceiveNotificationResponse {
  receiptId: number;
  body: {
    typeWebhook: string;
    instanceData?: {
      idInstance: number;
      wid?: string;
      typeInstance?: string;
    };
    timestamp?: number;
    idMessage?: string;
    senderData?: {
      chatId?: string;
      sender?: string;
      senderName?: string;
      chatName?: string;
    };
    messageData?: {
      typeMessage?: string;
      textMessageData?: {
        textMessage?: string;
      };
      extendedTextMessageData?: {
        text?: string;
      };
    };
    statusData?: {
      status?: string;
      idMessage?: string;
      chatId?: string;
    };
  };
}

export interface CheckAccountResponse {
  exist: boolean;
  chatId?: string;
  username?: string;
}
