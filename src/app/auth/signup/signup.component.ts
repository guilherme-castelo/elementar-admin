import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HorizontalDividerComponent } from '@elementar-ui/components/divider';
import { LogoComponent } from '@elementar-ui/components/logo';
import { NgOptimizedImage } from '@angular/common';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  imports: [
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    RouterLink,
    ReactiveFormsModule,
    HorizontalDividerComponent,
    LogoComponent,
    NgOptimizedImage,
    MatSnackBarModule,
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  private _formBuilder = inject(FormBuilder);
  private _authService = inject(AuthService);
  private _router = inject(Router);
  private _snackBar = inject(MatSnackBar);

  form = this._formBuilder.group({
    name: this._formBuilder.control('', [Validators.required]),
    email: this._formBuilder.control('', [
      Validators.required,
      Validators.email,
    ]),
    password: this._formBuilder.control('', [Validators.required]),
  });

  onSubmit() {
    if (this.form.invalid) return;

    this._authService.signUp(this.form.value).subscribe({
      next: () => {
        this._router.navigate(['/auth/done']);
      },
      error: (err) => {
        console.error(err);
        this._snackBar.open('Erro ao criar conta. Tente novamente.', 'Fechar', {
          duration: 5000,
          panelClass: ['bg-red-600', 'text-white'],
        });
      },
    });
  }
}
