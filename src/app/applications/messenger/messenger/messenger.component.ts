import { Component, inject, OnInit, Signal, WritableSignal, signal, effect, ElementRef, viewChild } from '@angular/core';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { DatePipe, CommonModule } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { SafeHtmlPipe } from '@elementar-ui/components/core';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelTitle,
  MatExpansionPanelHeader
} from '@angular/material/expansion';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { ImageViewerDirective, ImageViewerPictureDirective } from '@elementar-ui/components/image-viewer';
import { HorizontalDividerComponent } from '@elementar-ui/components/divider';
import { DicebearComponent } from '@elementar-ui/components/avatar';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChatMessage, ChatUser, Conversation } from '../../../core/models/chat.interface';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-messenger',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ImageViewerPictureDirective,
    MatInput,
    MatIcon,
    MatIconButton,
    DicebearComponent,
    DatePipe,
    MatTooltip,
    SafeHtmlPipe,
    MatExpansionPanel,
    MatAccordion,
    MatExpansionPanelTitle,
    MatExpansionPanelHeader,
    MatButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    ImageViewerPictureDirective,
    ImageViewerDirective,
    HorizontalDividerComponent
  ],
  templateUrl: './messenger.component.html',
  styleUrl: './messenger.component.scss'
})
export class MessengerComponent implements OnInit {
  private _chatService = inject(ChatService);
  private _authService = inject(AuthService);

  currentUser = this._authService.getUser();

  // Signals from Service
  conversations = toSignal(this._chatService.conversations$, { initialValue: [] });
  activeMessages = toSignal(this._chatService.activeMessages$, { initialValue: [] });
  activeConversationId = toSignal(this._chatService.activeConversationId$, { initialValue: null });

  availableUsers: WritableSignal<ChatUser[]> = signal([]);

  sidebarActive = true;
  newMessage = signal('');

  messagesContainerRef = viewChild<ElementRef>('messagesContainer');

  constructor() {
    effect(() => {
      // Monitor active messages to scroll to bottom
      const msgs = this.activeMessages();
      if (msgs.length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });

    // Auto-select first conversation if available and none selected
    effect(() => {
      const convs = this.conversations();
      const activeId = this.activeConversationId();
      if (convs.length > 0 && !activeId) {
        this._chatService.selectConversation(convs[0].id);
      }
    });
  }

  ngOnInit() {
    this._chatService.getUsersToChat().subscribe(users => {
      this.availableUsers.set(users);
    });
  }

  selectConversation(conversation: Conversation) {
    this._chatService.selectConversation(conversation.id);
  }

  startChat(userId: number) {
    this._chatService.startConversation(userId).subscribe();
  }

  isConversationSelected(conversation: Conversation) {
    return conversation.id === this.activeConversationId();
  }

  toggleSidebar() {
    this.sidebarActive = !this.sidebarActive;
  }

  sendMessage() {
    if (!this.newMessage().trim()) return;
    this._chatService.sendMessage(this.newMessage()).subscribe();
    this.newMessage.set('');
  }

  scrollToBottom() {
    // We need to bind this ref in HTML
    const container = document.querySelector('.chat-scroll-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // Helpers
  getConversationName(conv: Conversation): string {
    const otherId = conv.participantIds.find(id => id !== this.currentUser?.id);
    const user = this.availableUsers().find(u => u.id === otherId);
    return user ? user.name : 'User ' + otherId;
  }

  getConversationAvatar(conv: Conversation): string {
    const otherId = conv.participantIds.find(id => id !== this.currentUser?.id);
    // Use Dicebear seed
    return `https://api.dicebear.com/7.x/initials/svg?seed=${otherId}`;
  }

  // Time Separator Logic
  isNeedToShowTimeSeparator(messages: ChatMessage[], index: number): boolean {
    if (index === 0) return true;
    const prev = new Date(messages[index - 1].createdAt).toDateString();
    const curr = new Date(messages[index].createdAt).toDateString();
    return prev !== curr;
  }

  isInnerMessage(messages: ChatMessage[], index: number): boolean {
    if (index === 0) return false;
    const prev = messages[index - 1];
    const curr = messages[index];
    return prev.senderId === curr.senderId;
  }

  // For details sidebar
  getSelectedConversationUser(): ChatUser | undefined {
    const convId = this.activeConversationId();
    if (!convId) return undefined;
    const conv = this.conversations().find(c => c.id === convId);
    if (!conv) return undefined;

    const otherId = conv.participantIds.find(id => id !== this.currentUser?.id);
    return this.availableUsers().find(u => u.id === otherId);
  }
}
