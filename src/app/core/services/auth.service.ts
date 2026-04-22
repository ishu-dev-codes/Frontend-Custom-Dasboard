import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpService } from './http.service';

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
  location_id?: string;
  user_id?: string;
  [key: string]: any;
}

export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_DATA: 'token_data',
  EXPIRY: 'token_expiry',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken: string | null = null;


  private authState = new BehaviorSubject<boolean>(this.hasValidToken());
  authState$ = this.authState.asObservable();

  constructor(private http: HttpService) {
    // App start pe auth state set
    this.authState.next(this.hasValidToken());
  }


  getLoginUrl(): Observable<{ auth_url: string }> {
    return this.http.get<{ auth_url: string }>('auth/login');
  }


  exchangeCode(code: string): Observable<AuthTokenResponse> {
    return this.http
      .get<AuthTokenResponse>(`auth/callback?code=${code}`)
      .pipe(tap((data) => this.saveTokens(data)));
  }

  private saveTokens(data: AuthTokenResponse): void {
    this.setExpiry(data.access_token);
    this.accessToken = data.access_token;

    localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
    localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
    localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN_DATA, JSON.stringify(data));

    if (data.location_id) {
      localStorage.setItem('location_id', data.location_id);
    }

    this.authState.next(true);
  }

  private setExpiry(token: string) {
    let expiry: number;

 
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        expiry = payload.exp * 1000; // exp is in seconds
      } catch {
     
        expiry = Date.now() + 60 * 60 * 1000;
      }
    // }
    localStorage.setItem(AUTH_STORAGE_KEYS.EXPIRY, expiry.toString());
  }

  // Get access token (with caching)
  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    }
    return this.accessToken;
  }

  hasValidToken(): boolean {
    const token = this.getAccessToken();
    const expiry = localStorage.getItem(AUTH_STORAGE_KEYS.EXPIRY);

    if (!token || !expiry) return false;

    return Date.now() < +expiry;
  }

  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  refreshToken(): Observable<AuthTokenResponse> {
    const refresh_token = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
    const tokenData = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN_DATA);
    const userType = JSON.parse(tokenData ?? '').userType || '';
    return this.http
      .post<AuthTokenResponse>('auth/refresh', {
        refresh_token,
        userType,
      })
      .pipe(
        tap((res) => {
          this.saveTokens(res);
        }),
      );
  }

  logout(): void {
    Object.values(AUTH_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    this.accessToken = null;
    this.authState.next(false);
  }
}
