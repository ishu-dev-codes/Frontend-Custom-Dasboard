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
import { ConfigService, STORAGE_KEYS } from '../core/services/config.service';
import { SkeletonCard } from '../shared/components/skeleton-card/skeleton-card.component';
import { catchError, EMPTY, from, forkJoin, Subject, switchMap, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HeaderComponent, DateRange } from '../shared/components/header.component/header.component';
import { ActivatedRoute } from '@angular/router';

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
  private readonly configService = inject(ConfigService);
  private readonly route = inject(ActivatedRoute);

  private readonly metricsRefresh$ = new Subject<{ start?: string; end?: string }>();
  private readonly destroy$ = new Subject<void>();

  private activeRange: { start?: string; end?: string } = {};

  isLoading = false;
  activeModal: ModalTableData | null = null;
  marketingCards: GradientCardData[] = [];
  patientCards: StatCardData[] = [];
  roiCards: RoiCardData[] = [];
  locationId!: string;

  private readonly nonClickableMarketing = new Set(['avgCpl']);
  private readonly nonClickableRoi = new Set(['returnOnAdSpend', 'costPerAcquisition']);

  ngOnInit() {
    const params = this.route.snapshot.params as { locationId: string };

    if (params.locationId) {
      this.locationId = params.locationId;
      localStorage.setItem(STORAGE_KEYS.LOCATION_ID, this.locationId);
    }

    this.metricsRefresh$
      .pipe(
        switchMap(({ start, end }) => {
          this.isLoading = true;
          return from(this.configService.loadConfig(this.locationId)).pipe(
            switchMap(() =>
              forkJoin([
                this.dashboardService.getMarketingMetrics(this.locationId, start, end),
                this.dashboardService.getLeadConversionMetrics(this.locationId, start, end),
                this.dashboardService.getCaseAcceptanceMetrics(this.locationId, start, end),
              ]),
            ),
            catchError((err) => {
              this.isLoading = false;
              console.error('Metrics load failed:', err);
              return EMPTY;
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: ([marketing, leadConversion, caseAcceptance]) => {
          this.isLoading = false;
          this.marketingCards = (marketing.cards as GradientCardData[]).map(
            (card: GradientCardData) => ({
              ...card,
              clickable: !this.nonClickableMarketing.has(card.id),
            }),
          );
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
    const end = range.endDate ? this.toEndOfDay(range.endDate) : undefined;
    this.activeRange = { start, end };
    this.metricsRefresh$.next(this.activeRange);
  }

  private currentModalLoader: ((page: number, pageSize?: number) => void) | null = null;

  private readonly commonColumnDefs: ColumnDef[] = [
    { header: 'Opportunity Name', field: 'name' },
    { header: 'Contact Name', field: 'contact', extractor: (v) => v?.name ?? '' },
    { header: 'Phone number', field: 'contact', extractor: (v) => v?.phone ?? '' },
    { header: 'Lead Value', field: 'monetaryValue' },
    { header: 'Pipeline Stage', field: 'pipelineStage' },
    { header: 'Status', field: 'status' },
    {
      header: 'Created At',
      field: 'createdAt',
      extractor: (v) =>
        v
          ? new Date(v).toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            })
          : '',
    },
    {
      header: 'Tags',
      field: 'tags',
      extractor: (v) => (Array.isArray(v) ? v.join(', ') : (v ?? '')),
    },
    { header: 'Days in Stage', field: 'daysInStage' },
    { header: 'UTM Campaign (First)', field: 'attribution', extractor: (v) => v?.campaign ?? '' },
    { header: 'UTM Medium (First)', field: 'attribution', extractor: (v) => v?.medium ?? '' },
    { header: 'UTM Content (First)', field: 'attribution', extractor: (v) => v?.content ?? '' },
    { header: 'UTM Source (First)', field: 'attribution', extractor: (v) => v?.source ?? '' },
  ];

  private readonly metaCampaignColumnDefs: ColumnDef[] = [
    { header: 'Campaign Name', field: 'campaign_name' },
    { header: 'Spend', field: 'spend' },
    { header: 'Impressions', field: 'impressions' },
    { header: 'Clicks', field: 'clicks' },
    { header: 'CTR', field: 'ctr' },
    { header: 'CPC', field: 'cpc' },
  ];

  private readonly leadsWonColumnDefs: ColumnDef[] = [
    { header: 'Opportunity Name', field: 'name' },
    { header: 'Contact Name', field: 'contact', extractor: (v) => v?.name ?? '' },
    { header: 'Phone number', field: 'contact', extractor: (v) => v?.phone ?? '' },
    { header: 'Lead Value', field: 'monetaryValue' },
    { header: 'Pipeline Stage', field: 'pipelineStage' },
    { header: 'Status', field: 'status' },
    {
      header: 'Created At',
      field: 'createdAt',
      extractor: (v) =>
        v
          ? new Date(v).toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            })
          : '',
    },
    {
      header: 'Tags',
      field: 'tags',
      extractor: (v) => (Array.isArray(v) ? v.join(', ') : (v ?? '')),
    },
    { header: 'Days in Stage', field: 'daysInStage' },
    { header: 'Days Since Won', field: 'daysSinceWon' },
    { header: 'UTM Campaign (First)', field: 'attribution', extractor: (v) => v?.campaign ?? '' },
    { header: 'UTM Medium (First)', field: 'attribution', extractor: (v) => v?.medium ?? '' },
    { header: 'UTM Content (First)', field: 'attribution', extractor: (v) => v?.content ?? '' },
    { header: 'UTM Source (First)', field: 'attribution', extractor: (v) => v?.source ?? '' },
  ];

  private readonly cardColumnDefs: Record<string, ColumnDef[]> = {
    totalLeads: this.commonColumnDefs,
    leadsAbandoned: this.commonColumnDefs,
    leadsBooked: this.commonColumnDefs,
    treatmentAccepted: this.commonColumnDefs,
    opportunityPipeline: this.commonColumnDefs,
    leadsWon: this.leadsWonColumnDefs,
    leadsFta: this.commonColumnDefs,
    totalAdSpend: this.metaCampaignColumnDefs,
  };

  private readonly cardFallbackTitles: Record<string, string> = {
    totalLeads: '# Total SBX Leads',
    leadsAbandoned: '# Leads Abandoned',
    leadsBooked: '# Leads Booked',
    treatmentAccepted: 'Treatment Accepted',
    opportunityPipeline: 'Opportunity Pipeline',
    leadsWon: '# Leads Won',
    leadsFta: '# Leads FTA',
    totalAdSpend: 'Total Ad Spend',
  };

  openModal(cardId: string) {
    const apiCards = [
      'totalLeads',
      'totalAdSpend',
      'leadsAbandoned',
      'leadsBooked',
      'treatmentAccepted',
      'opportunityPipeline',
      'leadsWon',
      'leadsFta',
    ];
    if (apiCards.includes(cardId)) {
      this.currentModalLoader = (page, pageSize = 10) =>
        this.loadPaginatedModal(cardId, page, pageSize);
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
      case 'totalAdSpend':
        return this.dashboardService.getMetaCampaigns(params);
      case 'leadsAbandoned':
        return this.dashboardService.getLeadsAbandoned(params);
      case 'leadsBooked':
        return this.dashboardService.getLeadsBooked(params);
      case 'treatmentAccepted':
        return this.dashboardService.getLeadsWon(params);
      case 'leadsWon':
        return this.dashboardService.getLeadsWon(params);
      case 'leadsFta':
        return this.dashboardService.getLeadsFta(params);
      case 'opportunityPipeline':
        return this.dashboardService.getOpportunityPipeline(params);
      default:
        return this.dashboardService.getTotalSbxLeads(params);
    }
  }

  private loadPaginatedModal(cardId: string, page: number, pageSize = 10) {
    const params = {
      location_id: this.locationId,
      start_date: this.activeRange.start ?? '',
      end_date: this.activeRange.end ?? '',
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
        const rows = (res.records ?? []).map((record) =>
          defs.map((def) => {
            const val = Array.isArray(record)
              ? record[res.columns.indexOf(def.field)]
              : record[def.field];
            return def.extractor ? def.extractor(val) : (val ?? '');
          }),
        );
        this.activeModal = {
          title: this.cardFallbackTitles[cardId] || res.metric_name || cardId,
          headers: defs.map((d) => d.header),
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
