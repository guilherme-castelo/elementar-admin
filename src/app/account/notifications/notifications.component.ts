import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { DatePipe, CommonModule } from '@angular/common';
import { PageContentDirective } from '../../_meta/page/page-content.directive';
import { PageComponent } from '../../_meta/page/page.component';
import { NotificationService } from '../../core/services/notification.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    PageComponent,
    PageContentDirective,
    MatIcon,
    MatIconButton,
    MatTabsModule,
    MatListModule,
    DatePipe
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent {
  private _notificationService = inject(NotificationService);

  activeNotifications = toSignal(this._notificationService.activeNotifications$, { initialValue: [] });
  archivedNotifications = toSignal(this._notificationService.archivedNotifications$, { initialValue: [] });

  markAsRead(id: string) {
    this._notificationService.markAsRead(id);
  }

  archive(id: string) {
    this._notificationService.archive(id);
  }

  getLink(type: string, entityId: string | number): string {
    if (type === 'chat') {
      return '/applications/messenger'; // Ideally link to specific chat
    }
    if (type.startsWith('task')) {
      // Assuming task dialog or list
      return '/applications/task-dialog'; // Simplified for now
    }
    return '/';
  }
}
