export interface Conversation {
  id: string;
  participantIds: number[];
  createdAt: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastMessageSenderId?: number;
  lastMessageStatus?: 'sent' | 'delivered' | 'read';
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  readAt?: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface ChatUser {
  id: number;
  name: string;
  avatar?: string;
  status: 'online' | 'offline';
  role?: string;
}
