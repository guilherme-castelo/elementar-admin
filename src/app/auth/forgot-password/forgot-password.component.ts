import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { LogoComponent } from '@elementar-ui/components/logo';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  imports: [
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    RouterLink,
    ReactiveFormsModule,
    MatIcon,
    LogoComponent,
    NgOptimizedImage
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private _router = inject(Router);
  private _authService = inject(AuthService);

  email = new FormControl('', [Validators.required, Validators.email]);

  resetPassword() {
    if (this.email.invalid || !this.email.value) return;

    this._authService.forgotPassword(this.email.value).subscribe({
      next: () => {
        // Store email for the simulation flow in next step
        localStorage.setItem('reset_pending_email', this.email.value!);
        this._router.navigateByUrl('/auth/set-new-password'); // Changed to set-new-password as it sounds more like the "Enter new password" screen
      },
      error: (err) => {
        alert('Email not found');
      }
    });
  }
}
