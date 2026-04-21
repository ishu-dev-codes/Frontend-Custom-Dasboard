import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent, ModalTableData } from '../modal/modal.component';
import {
  GradientCardComponent,
  GradientCardData,
} from '../components/gradient-card/gradient-card.component';
import { StatCardComponent, StatCardData } from '../components/stat-card/stat-card.component';
import { RoiCardComponent, RoiCardData } from '../components/roi-card/roi-card.component';
import { DashboardService, SbxLeadsResponse } from '../core/services/dashboard.service';
import { SkeletonCard } from '../shared/components/skeleton-card/skeleton-card.component';
import { catchError, EMPTY, forkJoin, Subject, switchMap, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HeaderComponent, DateRange } from '../shared/components/header.component/header.component';

type ColumnDef = { header: string; field: string; extractor?: (v: any) => string };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    ModalComponent,
    GradientCardComponent,
    StatCardComponent,
    RoiCardComponent,
    FormsModule,
    SkeletonCard,
    CommonModule,
    HeaderComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);

  private readonly metricsRefresh$ = new Subject<{ start?: string; end?: string }>();
  private readonly destroy$ = new Subject<void>();

  private activeRange: { start?: string; end?: string } = {};

  isLoading = false;
  activeModal: ModalTableData | null = null;
  marketingCards: GradientCardData[] = [];
  patientCards: StatCardData[] = [];
  roiCards: RoiCardData[] = [];

  private readonly nonClickableMarketing = new Set(['avgCpl']);
  private readonly nonClickableRoi = new Set(['returnOnAdSpend', 'costPerAcquisition']);

  ngOnInit() {
    this.metricsRefresh$.pipe(
      switchMap(({ start, end }) => {
        this.isLoading = true;
        return forkJoin([
          this.dashboardService.getMarketingMetrics(start, end),
          this.dashboardService.getLeadConversionMetrics(start, end),
          this.dashboardService.getCaseAcceptanceMetrics(start, end),
        ]).pipe(
          catchError(err => {
            this.isLoading = false;
            console.error('Metrics load failed:', err);
            return EMPTY;
          }),
        );
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: ([marketing, leadConversion, caseAcceptance]) => {
        this.isLoading = false;
        this.marketingCards = (marketing.cards as GradientCardData[]).map((card: GradientCardData) => ({
          ...card,
          clickable: !this.nonClickableMarketing.has(card.id),
        }));
        this.patientCards = leadConversion.cards;
        this.roiCards = (caseAcceptance.cards as RoiCardData[]).map((card: RoiCardData) => ({
          ...card,
          clickable: !this.nonClickableRoi.has(card.id),
        }));
      },
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDateRangeChanged(range: DateRange) {
    const start = range.startDate ? this.toStartOfDay(range.startDate) : undefined;
    const end   = range.endDate   ? this.toEndOfDay(range.endDate)     : undefined;
    this.activeRange = { start, end };
    this.metricsRefresh$.next(this.activeRange);
  }

  private currentModalLoader: ((page: number, pageSize?: number) => void) | null = null;

  private readonly commonColumnDefs: ColumnDef[] = [
    { header: 'Name',       field: 'name' },
    { header: 'Value',      field: 'monetaryValue' },
    { header: 'Status',     field: 'status' },
    { header: 'Source',     field: 'source' },
    { header: 'Created At', field: 'createdAt',
      extractor: v => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '' },
    { header: 'Contact',    field: 'contact',
      extractor: v => v?.name ?? v?.email ?? '' },
    { header: 'Tags',       field: 'tags',
      extractor: v => Array.isArray(v) ? v.join(', ') : (v ?? '') },
    { header: 'Ad Source',  field: 'attribution',
      extractor: v => v?.adSource ?? '' },
  ];

  private readonly metaCampaignColumnDefs: ColumnDef[] = [
    { header: 'Campaign Name', field: 'campaign_name' },
    { header: 'Spend',         field: 'spend' },
    { header: 'Impressions',   field: 'impressions' },
    { header: 'Clicks',        field: 'clicks' },
    { header: 'CTR',           field: 'ctr' },
    { header: 'CPC',           field: 'cpc' },
  ];

  private readonly cardColumnDefs: Record<string, ColumnDef[]> = {
    totalLeads:          this.commonColumnDefs,
    leadsAbandoned:      this.commonColumnDefs,
    leadsBooked:         this.commonColumnDefs,
    treatmentAccepted:   this.commonColumnDefs,
    opportunityPipeline: this.commonColumnDefs,
    leadsWon:            this.commonColumnDefs,
    leadsFta:            this.commonColumnDefs,
    totalAdSpend:        this.metaCampaignColumnDefs,
  };

  private readonly cardFallbackTitles: Record<string, string> = {
    totalLeads:          '# Total SBX Leads',
    leadsAbandoned:      '# Leads Abandoned',
    leadsBooked:         '# Leads Booked',
    treatmentAccepted:   'Treatment Accepted',
    opportunityPipeline: 'Opportunity Pipeline',
    leadsWon:            '# Leads Won',
    leadsFta:            '# Leads FTA',
    totalAdSpend:        'Total Ad Spend',
  };

  openModal(cardId: string) {
    const apiCards = ['totalLeads', 'totalAdSpend', 'leadsAbandoned', 'leadsBooked', 'treatmentAccepted', 'opportunityPipeline', 'leadsWon', 'leadsFta'];
    if (apiCards.includes(cardId)) {
      this.currentModalLoader = (page, pageSize = 10) => this.loadPaginatedModal(cardId, page, pageSize);
      this.loadPaginatedModal(cardId, 1);
    }
  }

  private toStartOfDay(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  private toEndOfDay(date: Date): string {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }

  private getApiCall(cardId: string, params: any) {
    switch (cardId) {
      case 'totalAdSpend':      return this.dashboardService.getMetaCampaigns(params);
      case 'leadsAbandoned':    return this.dashboardService.getLeadsAbandoned(params);
      case 'leadsBooked':       return this.dashboardService.getLeadsBooked(params);
      case 'treatmentAccepted': return this.dashboardService.getLeadsWon(params);
      case 'leadsWon':          return this.dashboardService.getLeadsWon(params);
      case 'leadsFta':          return this.dashboardService.getLeadsFta(params);
      default:                  return this.dashboardService.getTotalSbxLeads(params);
    }
  }

  private loadPaginatedModal(cardId: string, page: number, pageSize = 10) {
    const params = {
      start_date: this.activeRange.start ?? '',
      end_date:   this.activeRange.end   ?? '',
      page,
      page_size: pageSize,
    };

    if (!this.activeModal) {
      this.activeModal = {
        title: this.cardFallbackTitles[cardId] || cardId,
        headers: [],
        rows: [],
        tableLoading: true,
      };
    } else {
      this.activeModal = { ...this.activeModal, tableLoading: true };
    }

    this.getApiCall(cardId, params).subscribe({
      next: (res: SbxLeadsResponse) => {
        const defs = this.cardColumnDefs[cardId] ?? this.commonColumnDefs;
        const rows = (res.records ?? []).map(record =>
          defs.map(def => {
            const val = Array.isArray(record) ? record[res.columns.indexOf(def.field)] : record[def.field];
            return def.extractor ? def.extractor(val) : (val ?? '');
          })
        );
        this.activeModal = {
          title: this.cardFallbackTitles[cardId] || res.metric_name || cardId,
          headers: defs.map(d => d.header),
          rows,
          total: res.total_count || res.total || rows.length,
          page: res.page || 1,
          pageSize: res.page_size || 10,
          tableLoading: false,
        };
      },
      error: () => {
        if (this.activeModal) {
          this.activeModal = { ...this.activeModal, tableLoading: false };
        }
      },
    });
  }

  onSbxLeadsPageChange(event: { page: number; pageSize: number }) {
    this.currentModalLoader?.(event.page, event.pageSize);
  }

  closeModal() {
    this.activeModal = null;
  }
}
