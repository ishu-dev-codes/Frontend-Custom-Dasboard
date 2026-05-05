import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { HttpService } from "./http.service";

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
  location_id: string;
  start_date: string;
  end_date: string;
  page?: number;
  page_size?: number;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    constructor(private http: HttpService) {}

  getMarketingMetrics(locationId: string, startDate?: string, endDate?: string): Observable<any> {
    return this.http.get('metrics/marketing-metrics/cards', {
      location_id: locationId,
      ...(startDate && { start_date: startDate }),
      ...(endDate   && { end_date:   endDate   }),
    });
  }

  getCaseAcceptanceMetrics(locationId: string, startDate?: string, endDate?: string): Observable<any> {
    return this.http.get('metrics/case-acceptance-metrics/cards', {
      location_id: locationId,
      ...(startDate && { start_date: startDate }),
      ...(endDate   && { end_date:   endDate   }),
    });
  }

  getTotalSbxLeads(params: SbxLeadsParams): Observable<SbxLeadsResponse> {
    return this.http.get<SbxLeadsResponse>('metrics/total-sbx-leads', {
      location_id: params.location_id,
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
    });
  }

  getLeadsAbandoned(params: SbxLeadsParams): Observable<SbxLeadsResponse> {
    return this.http.get<SbxLeadsResponse>('metrics/leads-abandoned', {
      location_id: params.location_id,
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
    });
  }

  getLeadsBooked(params: SbxLeadsParams): Observable<SbxLeadsResponse> {
    return this.http.get<SbxLeadsResponse>('metrics/leads-booked', {
      location_id: params.location_id,
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
    });
  }

  getLeadsWon(params: SbxLeadsParams): Observable<SbxLeadsResponse> {
    return this.http.get<SbxLeadsResponse>('metrics/leads-won', {
      location_id: params.location_id,
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
    });
  }

  getLeadsFta(params: SbxLeadsParams): Observable<SbxLeadsResponse> {
    return this.http.get<SbxLeadsResponse>('metrics/leads-fta', {
      location_id: params.location_id,
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
    });
  }

  getOpportunityPipeline(params: SbxLeadsParams): Observable<SbxLeadsResponse> {
    return this.http.get<SbxLeadsResponse>('metrics/opportunity-pipeline', {
      location_id: params.location_id,
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
    });
  }

  getLeadConversionMetrics(locationId: string, startDate?: string, endDate?: string): Observable<any> {
    return this.http.get('metrics/lead-conversion-metrics/cards', {
      location_id: locationId,
      ...(startDate && { start_date: startDate }),
      ...(endDate   && { end_date:   endDate   }),
    });
  }

  getMetaCampaigns(params: { location_id: string; start_date: string; end_date: string; page?: number; page_size?: number }): Observable<SbxLeadsResponse> {
    return this.http.get<SbxLeadsResponse>('metrics/meta-campaigns', {
      location_id: params.location_id,
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
    });
  }
}
