import { Component, OnInit } from '@angular/core';
import { MatBadge } from '@angular/material/badge';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { HorizontalDividerComponent } from '@elementar-ui/components/divider';
import { DicebearComponent } from '@elementar-ui/components/avatar';

import { AuthService } from '../../../core/services/auth.service';
import { inject } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'emr-sidebar-toolbar',
  imports: [
    MatBadge,
    MatIcon,
    MatIconButton,
    RouterLink,
    MatTooltip,
    DicebearComponent,
    HorizontalDividerComponent
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent implements OnInit {
  private _authService = inject(AuthService);
  subscription = 'Free';
  email = '';
  name = '';

  ngOnInit() {
    const user = this._authService.getUser();
    if (user) {
      this.name = user.name;
      this.email = user.email;
    }
  }

  logout() {
    this._authService.logout();
  }
}
