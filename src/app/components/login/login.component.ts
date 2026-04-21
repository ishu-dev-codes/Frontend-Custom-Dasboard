import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {

  loading = false;
  error: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
  
  }

  login(): void {
    this.loading = true;
    this.error = null;

    this.authService.getLoginUrl().subscribe({
      next: (res) => {
        if (res?.auth_url) {
          window.location.href = res.auth_url;
        } else {
          this.handleError('Invalid login URL');
        }
      },
      error: () => {
        this.handleError('Failed to initiate login');
      }
    });
  }

  private handleError(message: string) {
    this.loading = false;
    this.error = message;
  }
}
