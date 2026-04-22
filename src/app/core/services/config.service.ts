import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const FALLBACK_AD_ACCOUNT_ID = '50422357';

export const STORAGE_KEYS = {
  LOCATION_ID: 'location_id',
  AD_ACCOUNT_ID: 'ad_account_id',
};

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private configUrl = `${environment.BASE_URL}/admin/config`;

  constructor(private http: HttpClient) {}

  loadConfig(locationId: string): Promise<void> {
    return new Promise((resolve) => {
      this.http
        .get<{ location_id: string | null; ad_account_id: string | null }>(
          this.configUrl,
          { params: { location_id: locationId } }
        )
        .subscribe({
          next: (config) => {
            localStorage.setItem(STORAGE_KEYS.AD_ACCOUNT_ID, config.ad_account_id || '');
            resolve();
          },
          error: () => {
            localStorage.setItem(STORAGE_KEYS.AD_ACCOUNT_ID, '');
            resolve();
          },
        });
    });
  }
}
