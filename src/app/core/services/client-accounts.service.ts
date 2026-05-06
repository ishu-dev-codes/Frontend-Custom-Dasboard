import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ClientAccount, ClientAccountPayload, MetaTokenResponse } from '../models/client-account.model';


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

  getMetaToken(): Observable<MetaTokenResponse> {
    return this.http.get<MetaTokenResponse>('meta-config/token');
  }

  updateMetaToken(token: string): Observable<MetaTokenResponse> {
    return this.http.post<MetaTokenResponse>('meta-config/token', { token });
  }
}
