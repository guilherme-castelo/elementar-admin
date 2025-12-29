import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatButtonModule, 
    MatCardModule, 
    MatIconModule
  ]
})
export class LandingComponent {
  private authService = inject(AuthService);
  
  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  scrollTo(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
