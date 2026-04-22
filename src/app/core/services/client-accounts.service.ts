import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';

export interface ClientAccount {
  id: number;
  client_name: string;
  location_id: string;
  ad_account_id: string;
  ad_account_name: string;
}

export type ClientAccountPayload = Omit<ClientAccount, 'id'>;

@Injectable({ providedIn: 'root' })
export class ClientAccountsService {
  constructor(private http: HttpService) {}

  getAll(): Observable<ClientAccount[]> {
    return this.http.get<ClientAccount[]>('client-accounts/');
  }

  getById(id: number): Observable<ClientAccount> {
    return this.http.get<ClientAccount>(`client-accounts/${id}`);
  }

  create(payload: ClientAccountPayload): Observable<ClientAccount> {
    return this.http.post<ClientAccount>('client-accounts/', payload);
  }

  update(id: number, payload: ClientAccountPayload): Observable<ClientAccount> {
    return this.http.put<ClientAccount>(`client-accounts/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`client-accounts/${id}`);
  }
}
