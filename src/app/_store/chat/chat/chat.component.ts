import { Component, ElementRef, OnInit, WritableSignal, effect, inject, signal, viewChild, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDivider } from '@angular/material/divider';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatInput, MatSuffix } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import {
  PanelBodyComponent,
  PanelComponent,
  PanelFooterComponent,
  PanelHeaderComponent
} from '@elementar-ui/components/panel';
import { DicebearComponent } from '@elementar-ui/components/avatar';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChatUser, Conversation } from '../../../core/models/chat.interface';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIcon,
    MatDivider,
    MatInput,
    MatIconButton,
    MatFormField,
    MatListModule,
    PanelComponent,
    PanelBodyComponent,
    PanelHeaderComponent,
    PanelFooterComponent,
    MatSuffix,
    DicebearComponent
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {
  private _chatService = inject(ChatService);
  private _authService = inject(AuthService);

  chatMessagesContainerRef = viewChild<ElementRef>('messagesContainerRef');

  // State
  viewMode: WritableSignal<'LIST' | 'CHAT'> = signal('LIST');
  currentUser = this._authService.getUser();
  newMessage = signal('');

  // Data Signals
  conversations = toSignal(this._chatService.conversations$, { initialValue: [] });
  activeMessages = toSignal(this._chatService.activeMessages$, { initialValue: [] });
  activeConversationId = toSignal(this._chatService.activeConversationId$, { initialValue: null });

  availableUsers: WritableSignal<ChatUser[]> = signal([]);

  readonly closed = output();

  constructor() {
    effect(() => {
      // Auto-scroll on new messages
      const msgs = this.activeMessages();
      if (msgs.length > 0 && this.viewMode() === 'CHAT') {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  ngOnInit() {
    this.loadAvailableUsers();
  }

  loadAvailableUsers() {
    this._chatService.getUsersToChat().subscribe(users => {
      this.availableUsers.set(users);
    });
  }

  close(): void {
    this.closed.emit();
  }

  startChat(userId: number) {
    this._chatService.startConversation(userId).subscribe({
      next: (convId) => {
        this.viewMode.set('CHAT');
      },
      error: (err) => console.error(err)
    });
  }

  openConversation(convId: string) {
    this._chatService.selectConversation(convId);
    this.viewMode.set('CHAT');
  }

  backToList() {
    this.viewMode.set('LIST');
  }

  sendMessage(): void {
    if (this.newMessage().trim() === '') return;

    this._chatService.sendMessage(this.newMessage()).subscribe();
    this.newMessage.set('');
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    const container = this.chatMessagesContainerRef();
    if (container) {
      try {
        container.nativeElement.scrollTop = container.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Scroll error', err);
      }
    }
  }

  // Helpers for template
  getConversationName(conv: Conversation): string {
    // Simple logic: find 'other' participant name
    // In a real app, we'd map IDs to User objects more robustly or store names in Conversation
    // For now, let's use a placeholder or derived if possible. 
    // Since we don't store names in Conversation, let's assume it's a 1:1 and we might need to look it up from availableUsers
    // optimization: Store participant names in conversation or robust user cache
    // Let's rely on availableUsers for now if loaded, or "Chat"
    const otherId = conv.participantIds.find(id => id !== this.currentUser?.id);
    const user = this.availableUsers().find(u => u.id === otherId);

    return user ? user.name : 'Unknown User';
  }

  getConversationAvatar(conv: Conversation): string {
    const otherId = conv.participantIds.find(id => id !== this.currentUser?.id);
    const user = this.availableUsers().find(u => u.id === otherId);
    return user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${otherId}`;
  }
}
