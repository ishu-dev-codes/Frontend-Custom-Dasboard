import { HttpInterceptorFn } from '@angular/common/http';
import { STORAGE_KEYS } from '../services/config.service';

export const locationInterceptor: HttpInterceptorFn = (req, next) => {
  const locationId = localStorage.getItem(STORAGE_KEYS.LOCATION_ID);
  const adAccountId = localStorage.getItem(STORAGE_KEYS.AD_ACCOUNT_ID);

  const headers: Record<string, string> = {};
  if (locationId) headers['X-Location-Id'] = locationId;
  if (adAccountId) headers['X-Ad-Account-Id'] = adAccountId;

  if (Object.keys(headers).length) {
    return next(req.clone({ setHeaders: headers }));
  }

  return next(req);
};
