import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { PinInputComponent } from '@elementar-ui/components/pin-input';
import { LogoComponent } from '@elementar-ui/components/logo';
import { NgOptimizedImage } from '@angular/common';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-password-reset',
  imports: [
    FormsModule,
    MatButton,
    RouterLink,
    ReactiveFormsModule,
    MatIcon,
    PinInputComponent,
    LogoComponent,
    NgOptimizedImage,
    MatSnackBarModule,
  ],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.scss',
})
export class PasswordResetComponent {
  private _router = inject(Router);
  private _snackBar = inject(MatSnackBar);
  pin = new FormControl('', [Validators.required]);
  pendingEmail =
    localStorage.getItem('reset_pending_email') || 'your-email@example.com';

  resendCode(): void {
    this._snackBar.open('Code resent (simulated)', 'OK', { duration: 3000 });
  }

  continue() {
    if (this.pin.valid) {
      // Simulate token passed to next step via localStorage or URL.
      // For MVP we just assume the "flow" is valid if they pass this screen.
      this._router.navigateByUrl('/auth/set-new-password');
    }
  }
}
