import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const ALLOWED_LOCATION_ID = 'wLbWopWGch5Col0WyuJd';

@Injectable({ providedIn: 'root' })
export class ClientAccountsGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    const locationId = localStorage.getItem('location_id');
    if (locationId !== ALLOWED_LOCATION_ID) {
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}
