import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.scss',
})
export class AuthCallbackComponent implements OnInit {

  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    const errorParam = this.route.snapshot.queryParamMap.get('error');

  
    if (errorParam) {
      this.loading = false;
      this.error = 'Login failed or cancelled';
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }

 
    if (!code) {
      this.loading = false;
      this.error = 'Invalid login response';
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }

 
    this.authService.exchangeCode(code).subscribe({
      next: (res) => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.error = 'Authentication failed';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      }
    });
  }
}
