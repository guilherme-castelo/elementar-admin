import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AvatarComponent } from '@elementar-ui/components/avatar';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import { IUser } from '../../../core/models/user.model';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    AvatarComponent
  ],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss'
})
export class MyProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private _authService = inject(AuthService);
  private _usersService = inject(UsersService);
  private _snackBar = inject(MatSnackBar);

  currentUser: IUser | null = null;
  profileForm!: FormGroup;
  isEditingMap: { [key: string]: boolean } = {};
  isLoading = false;

  ngOnInit() {
    this.initForm();
    this.loadUser();
  }

  private initForm() {
    this.profileForm = this.fb.group({
      // Read-only / Hidden
      id: [''],
      roleId: [null],
      companyId: [''],

      // Personal Info
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      jobTitle: [''],
      bio: [''],

      // Address
      address: this.fb.group({
        country: [''],
        city: [''],
        street: [''],
        postalCode: [''],
        building: [''],
        apartment: ['']
      }),

      // Preferences
      preferences: this.fb.group({
        language: this.fb.group({
          code: [''],
          name: ['']
        }),
        dateFormat: [''],
        automaticTimeZone: this.fb.group({
          name: [''],
          isEnabled: [false]
        })
      })
    });

    // Disable immutable fields
    this.profileForm.get('email')?.disable(); // Usually email change requires verification
  }

  loadUser() {
    const authUser = this._authService.getUser();
    if (authUser && authUser.id) {
      this.isLoading = true;
      this._usersService.getById(authUser.id).subscribe({
        next: (user) => {
          this.currentUser = user;
          this.patchForm(user);
          this.isLoading = false;
        },
        error: (err) => {
          this.showFeedback('Erro ao carregar perfil', 'error');
          this.isLoading = false;
        }
      });
    }
  }

  patchForm(user: IUser) {
    this.profileForm.patchValue({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      jobTitle: user.jobTitle,
      bio: user.bio,
      companyId: user.companyId,
      roleId: user.roleId
    });

    if (user.address) {
      this.profileForm.get('address')?.patchValue(user.address);
    }

    if (user.preferences) {
      this.profileForm.get('preferences')?.patchValue(user.preferences);
    }
  }

  toggleEdit(section: string) {
    this.isEditingMap[section] = !this.isEditingMap[section];
    if (!this.isEditingMap[section]) {
      // Cancelled edit? Reload or just keep form state?
      // For simplicity, we just toggle UI. 
      // If "Save" is separate, we keep it. 
      // If "Edit" turns into "Save", we handle save.
    }
  }

  save() {
    if (this.profileForm.invalid) return;
    if (!this.currentUser) return;

    const formValue = this.profileForm.getRawValue();
    const updatedUser: IUser = {
      ...this.currentUser, // Keep existing fields (like password)
      ...formValue
    };

    this._usersService.update(this.currentUser.id, updatedUser).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.showFeedback('Perfil atualizado com sucesso!', 'success');
        // Update local session if name changed
        this._authService.updateUser(user);
        this.isEditingMap = {}; // Close all edits
      },
      error: () => this.showFeedback('Erro ao atualizar perfil', 'error')
    });
  }

  private showFeedback(message: string, type: 'success' | 'error') {
    this._snackBar.open(message, 'FECHAR', {
      duration: 3000,
      panelClass: type === 'error' ? ['bg-red-600', 'text-white'] : ['bg-green-600', 'text-white'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  // Helpers for template
  get firstName(): string {
    return this.currentUser?.name?.split(' ')[0] || '';
  }

  get lastName(): string {
    const parts = this.currentUser?.name?.split(' ') || [];
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }

  get username(): string {
    return this.currentUser?.email ? '@' + this.currentUser.email.split('@')[0] : '';
  }

  get initials(): string {
    if (!this.currentUser?.name) return 'U';
    const parts = this.currentUser.name.split(' ').filter(p => p);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return this.currentUser.name.slice(0, 2).toUpperCase();
  }
}
