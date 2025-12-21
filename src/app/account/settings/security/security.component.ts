import { Component, inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { HorizontalDividerComponent } from '@elementar-ui/components/divider';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  imports: [
    MatButton,
    MatIcon,
    MatSlideToggle,
    FormsModule,
    HorizontalDividerComponent
  ],
  templateUrl: './security.component.html',
  styleUrl: './security.component.scss'
})
export class SecurityComponent implements OnInit {
  private _authService = inject(AuthService);
  private _snackBar = inject(MatSnackBar);

  securityProfile = {
    email: '',
    isEmailVerified: true,
    mfaConfigured: false,
    mfaEnabled: false
  };

  ngOnInit() {
    const user = this._authService.getUser();
    if (user) {
      this.securityProfile.email = user.email;
    }
  }

  changePassword() {
    this._snackBar.open('Funcionalidade de alterar senha simulada com sucesso!', 'OK', { duration: 3000 });
  }

  setup2stepVerification() {
    this.securityProfile.mfaConfigured = true;
    this.securityProfile.mfaEnabled = true;
    this._snackBar.open('MFA configurado (Simulação)', 'OK', { duration: 3000 });
  }
}
