import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { DicebearComponent } from '@elementar-ui/components/avatar';
import { AuthService } from '../../../core/services/auth.service';
import { inject } from '@angular/core';

@Component({
  selector: 'emr-sidebar-toolbar-a',
  imports: [
    MatIcon,
    MatButton,
    DicebearComponent
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarAComponent {
  private _authService = inject(AuthService);

  logout() {
    this._authService.logout();
  }
}
