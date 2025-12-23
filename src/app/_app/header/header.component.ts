import { Component, computed, inject, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor, MatButton, MatIconButton } from '@angular/material/button';
import { MatBadge } from '@angular/material/badge';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { DicebearComponent } from '@elementar-ui/components/avatar';
import { SoundEffectDirective } from '@elementar-ui/components/core';
import { LayoutApiService } from '@elementar-ui/components/layout';
import { AssistantSearchComponent, NotificationsPopoverComponent } from '../../_store/header';
import { DrawerComponent } from '@elementar-ui/components/drawer';
import { ChatComponent } from '../../_store/chat/chat/chat.component';
import {
  ColorSchemeDarkDirective,
  ColorSchemeLightDirective,
  ColorSchemeSwitcherComponent
} from '@elementar-ui/components/color-scheme';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ChatService } from '../../core/services/chat.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    MatIcon,
    MatIconButton,
    MatBadge,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    DicebearComponent,
    MatDivider,
    MatButton,
    MatTooltip,
    RouterLink,
    AssistantSearchComponent,
    MatAnchor,
    SoundEffectDirective,
    NotificationsPopoverComponent,
    DrawerComponent,
    ChatComponent,
    ColorSchemeDarkDirective,
    ColorSchemeLightDirective,
    ColorSchemeSwitcherComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  host: {
    'class': 'block w-full'
  }
})
export class HeaderComponent implements OnInit {
  private _layoutApi = inject(LayoutApiService);
  private _authService = inject(AuthService);
  private _notificationService = inject(NotificationService);

  name = '';
  email = '';

  private _chatService = inject(ChatService);
  unreadChatCount = toSignal(this._chatService.totalUnreadCount$, { initialValue: 0 });

  unreadNotificationsCount = toSignal(this._notificationService.unreadCount$, { initialValue: 0 });
  recentNotifications = toSignal(this._notificationService.activeNotifications$, { initialValue: [] });


  sidebarShown = computed(() => {
    return this._layoutApi.isSidebarShown('root')
  });

  ngOnInit() {
    const user = this._authService.getUser();
    if (user) {
      this.name = user.name;
      this.email = user.email;
    }
  }

  toggleSidebar(): void {
    if (this.sidebarShown()) {
      this._layoutApi.hideSidebar('root');
    } else {
      this._layoutApi.showSidebar('root');
    }
  }

  logout(): void {
    this._authService.logout();
  }
}
