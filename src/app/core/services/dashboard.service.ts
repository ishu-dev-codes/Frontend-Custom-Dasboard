import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { HttpService } from "./http.service";
import { AuthService } from "./auth.service";

export interface SbxLeadsResponse {
  metric_name: string;
  columns: string[];
  records: any[];
  total: number;
  total_count: number;
  total_pages: number;
  page: number;
  page_size: number;
}

export interface SbxLeadsParams {
  start_date: string;
  end_date: string;
  page?: number;
  page_size?: number;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService{
    constructor(private http: HttpService, private authService: AuthService) {}


  getMarketingMetrics(startDate?: string, endDate?: string): Observable<any> {
    return this.http.get('metrics/marketing-metrics/cards', {
      access_token: this.authService.getAccessToken(),
      ...(startDate && { start_date: startDate }),
      ...(endDate   && { end_date:   endDate   }),
    });
  }

  getCaseAcceptanceMetrics(startDate?: string, endDate?: string): Observable<any> {
    return this.http.get('metrics/case-acceptance-metrics/cards', {
      access_token: this.authService.getAccessToken(),
      ...(startDate && { start_date: startDate }),
      ...(endDate   && { end_date:   endDate   }),
    });
  }

  getTotalSbxLeads(params: SbxLeadsParams): Observable<SbxLeadsResponse> {
    return this.http.get<SbxLeadsResponse>('metrics/total-sbx-leads', {
      access_token: this.authService.getAccessToken(),
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
    });
  }

  getLeadsAbandoned(params: SbxLeadsParams): Observable<SbxLeadsResponse> {
    return this.http.get<SbxLeadsResponse>('metrics/leads-abandoned', {
      access_token: this.authService.getAccessToken(),
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
    });
  }

  getLeadsBooked(params: SbxLeadsParams): Observable<SbxLeadsResponse> {
    return this.http.get<SbxLeadsResponse>('metrics/leads-booked', {
      access_token: this.authService.getAccessToken(),
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
    });
  }

  getLeadsWon(params: SbxLeadsParams): Observable<SbxLeadsResponse> {
    return this.http.get<SbxLeadsResponse>('metrics/leads-won', {
      access_token: this.authService.getAccessToken(),
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
    });
  }

  getLeadsFta(params: SbxLeadsParams): Observable<SbxLeadsResponse> {
    return this.http.get<SbxLeadsResponse>('metrics/leads-fta', {
      access_token: this.authService.getAccessToken(),
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
    });
  }

  getLeadConversionMetrics(startDate?: string, endDate?: string): Observable<any> {
    return this.http.get('metrics/lead-conversion-metrics/cards', {
      access_token: this.authService.getAccessToken(),
      ...(startDate && { start_date: startDate }),
      ...(endDate   && { end_date:   endDate   }),
    });
  }

  getMetaCampaigns(params: { start_date: string; end_date: string; page?: number; page_size?: number }): Observable<SbxLeadsResponse> {
    return this.http.get<SbxLeadsResponse>('metrics/meta-campaigns', {
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
    });
  }
}

