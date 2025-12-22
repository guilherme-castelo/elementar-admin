export interface Conversation {
  id: string;
  participantIds: number[];
  createdAt: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface ChatUser {
  id: number;
  name: string;
  avatar?: string;
  status: 'online' | 'offline';
  role?: string;
}
