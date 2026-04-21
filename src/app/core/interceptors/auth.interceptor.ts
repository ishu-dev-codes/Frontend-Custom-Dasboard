import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService, AUTH_STORAGE_KEYS } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

// use stored expiry (no decoding here)
function isTokenExpiringSoon(bufferMs = (23 * 60 * 60 * 1000) + 3480000): boolean {
  const expiry = Number(localStorage.getItem(AUTH_STORAGE_KEYS.EXPIRY));
  if (!expiry) return true;

  return expiry - Date.now() < bufferMs;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // skip public APIs
  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  const token = authService.getAccessToken();

  // PROACTIVE REFRESH (before request)
  if (token && isTokenExpiringSoon()) {

    if (!isRefreshing) {
      isRefreshing = true;
      refreshTokenSubject.next(null);

      return authService.refreshToken().pipe(
        switchMap((res: any) => {
          isRefreshing = false;

          const newToken = res.access_token;
          refreshTokenSubject.next(newToken);

          return next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            })
          );
        }),
        catchError((err) => {
          isRefreshing = false;
          authService.logout();
          return throwError(() => err);
        })
      );
    } else {
      // wait for ongoing refresh
      return refreshTokenSubject.pipe(
        filter((t): t is string => t !== null),
        take(1),
        switchMap((newToken) =>
          next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            })
          )
        )
      );
    }
  }

  // normal request
  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // fallback (in case expiry check missed)
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status === 401 && !req.url.includes('/auth/refresh')) {

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap((res: any) => {
              isRefreshing = false;

              const newToken = res.access_token;
              refreshTokenSubject.next(newToken);

              return next(
                req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`
                  }
                })
              );
            }),
            catchError((err) => {
              isRefreshing = false;
              authService.logout();
              return throwError(() => err);
            })
          );
        } else {
          return refreshTokenSubject.pipe(
            filter((t): t is string => t !== null),
            take(1),
            switchMap((newToken) =>
              next(
                req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`
                  }
                })
              )
            )
          );
        }
      }

      return throwError(() => error);
    })
  );
};