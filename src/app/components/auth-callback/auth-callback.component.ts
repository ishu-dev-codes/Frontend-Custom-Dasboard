import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ConfigService } from '../../core/services/config.service';

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
    private configService: ConfigService,
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
      next: async (res) => {
        const tokenData = JSON.parse(localStorage.getItem('token_data') || '{}');
        const locationId =
          res.location_id ||
          res['locationId'] ||
          tokenData.location_id ||
          tokenData['locationId'] ||
          localStorage.getItem('location_id') ||
          '';

        if (locationId) {
          localStorage.setItem('location_id', locationId);
          await this.configService.loadConfig(locationId);
        }

        const destination = locationId === 'wLbWopWGch5Col0WyuJd' ? '/client-accounts' : '/dashboard';
        this.router.navigate([destination]);
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
