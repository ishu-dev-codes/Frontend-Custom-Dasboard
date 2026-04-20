import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
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
    Select,
    DatePicker,
    SkeletonCard,
    CommonModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  YOUR_LOCATION_ID = 'Lu2BJ0o55ygd4eclFR5y';
  YOUR_ACCESS_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiTHUyQkowbzU1eWdkNGVjbEZSNXkiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjk5NTZjMDIzMGU2ZGFiNTkxYmVhMTdlLW1scnFpd3hqIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiTHUyQkowbzU1eWdkNGVjbEZSNXkiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnRhY3RzLnJlYWRvbmx5IiwibG9jYXRpb25zLnJlYWRvbmx5Iiwib3Bwb3J0dW5pdGllcy5yZWFkb25seSJdLCJjbGllbnQiOiI2OTk1NmMwMjMwZTZkYWI1OTFiZWExN2UiLCJ2ZXJzaW9uSWQiOiI2OWJjZjNkZWMwYzhhNzNiMjFjOGIwNTEiLCJjbGllbnRLZXkiOiI2OTk1NmMwMjMwZTZkYWI1OTFiZWExN2UtbWxycWl3eGoifSwiaWF0IjoxNzc2NjE4OTAwLjQ3NSwiZXhwIjoxNzc2NzA1MzAwLjQ3NX0.OaldgQPmjCHN176sFeYMaVcPyF-byfcJkHMbljRHRINvaQCbkSHnx-HpXas_9uZnRK-h6yTCgv3Bcd4dnfvbsxWJFHas6OjURhw6eXc7pTkKluIfOEkUZQNhz7B-m_DgvuAFO6t7-_6W_CxzR0mAX2BdEw7qpg6XxP9Tb9JkXQ1MwdBaL_AMXKr2Xf9H29rPo1j3mqy5KSxcoHyPDV_rT7ZQ62LlNujUDD9UEjzjH2gTgnSA7MhpFPWaT3mqPBktLvIVqoiy-yFLcgSGhPT6IpbxY-vuEq9Fo2rsmZOCAhtKFOMB6fARAdyYjXOummosFjjIZDiT6uXizUWz7P5nB7PHZ7iM2FGeQTJzOFiCL474SJX_AtTIybNlWwwHFFNA2RdCObt6RgUSzy2yFAxwQc3fW6GmJahUHXAIuzK4G7Mlt2QxDhlBuLwB6gexdJ95tDC7B0cwEtc7uUB6dRWahgygVy7RMEoJPy4VXFZDY_IYGnWlPJJnWjmcGrJ2GYSE2wiWcpuWEWtwtKjeu3U7AK8WKqO9JksDKIKbcyKptD1yXBJftXlBs0AtyO1RR4-WpzPC0JNmLxoC4xvFQceObmfUq4IP-UHj4E-R_XrjXiadt9h4irC5GaJFwwkL5C_OvQxAVjeKhH_EHnVZ8qkLNSV-A5sufWPDeZvO9nesO5A';

  private readonly metricsRefresh$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  private activePreset = 'last_month';
  private activeCustomDateRange: Date[] | null = null;

  isLoading = false;
  activeModal: ModalTableData | null = null;
  marketingCards: GradientCardData[] = [];
  patientCards: StatCardData[] = [];
  roiCards: RoiCardData[] = [];
  logoUrl = '';

  datePresets = [
    { label: 'This Week', value: 'this_week' },
    { label: 'Last Week', value: 'last_week' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'Last 3 Months', value: 'last_3_months' },
    { label: 'Last Year', value: 'last_year' },
    { label: 'All Time', value: 'all_time' },
    { label: 'Custom Range', value: 'custom' },
  ];

  selectedPreset = 'last_month';
  customDateRange: Date[] | null = null;

  intervalOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly (7 days)', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ];
  selectedInterval = 'weekly';

  private readonly nonClickableMarketing = new Set(['avgCpl']);
  private readonly nonClickableRoi = new Set(['returnOnAdSpend', 'costPerAcquisition']);

  ngOnInit() {
    this.logoUrl = new URLSearchParams(window.location.search).get('logoUrl') || '';

    this.metricsRefresh$.pipe(
      switchMap(() => {
        this.isLoading = true;
        const { startDate, endDate } = this.getDateRange();
        const start = startDate ? this.toStartOfDay(startDate) : undefined;
        const end   = endDate   ? this.toEndOfDay(endDate)     : undefined;

        return forkJoin([
          this.dashboardService.getMarketingMetrics(this.YOUR_ACCESS_TOKEN, start, end),
          this.dashboardService.getLeadConversionMetrics(this.YOUR_ACCESS_TOKEN, start, end),
          this.dashboardService.getCaseAcceptanceMetrics(this.YOUR_ACCESS_TOKEN, start, end),
        ]).pipe(
          catchError(err => {
            this.isLoading = false;
            // Revert UI to the last successfully loaded preset
            this.selectedPreset    = this.activePreset;
            this.customDateRange   = this.activeCustomDateRange;
            console.error('Metrics load failed, reverting to previous preset:', err);
            return EMPTY; // Swallow the error so the outer stream stays alive
          }),
        );
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: ([marketing, leadConversion, caseAcceptance]) => {
        this.isLoading = false;
        // Commit the pending preset as the new active one
        this.activePreset          = this.selectedPreset;
        this.activeCustomDateRange = this.customDateRange ? [...this.customDateRange] : null;
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

    this.getMetrics();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getMetrics() {
    this.metricsRefresh$.next();
  }

  getDateRange(): { startDate: Date | null; endDate: Date | null } {
    const now = new Date();

    switch (this.selectedPreset) {
      case 'this_week': {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        return { startDate: start, endDate: now };
      }

      case 'last_week': {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() - 7);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        return { startDate: start, endDate: end };
      }

      case 'last_month': {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { startDate: start, endDate: end };
      }

      case 'last_3_months': {
        const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return { startDate: start, endDate: now };
      }

      case 'last_year': {
        const start = new Date(now.getFullYear() - 1, 0, 1);
        const end = new Date(now.getFullYear() - 1, 11, 31);
        return { startDate: start, endDate: end };
      }

      case 'custom': {
        if (this.customDateRange?.length === 2) {
          return {
            startDate: this.customDateRange[0],
            endDate: this.customDateRange[1],
          };
        }
        return { startDate: null, endDate: null };
      }

      case 'all_time':
        return { startDate: null, endDate: null };

      default:
        return { startDate: null, endDate: null };
    }
  }

  getDateRangeDisplay(): string {
    const fmt = (d: Date | null) =>
      d ? d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
    const dates = this.getDateRange();
    return `${fmt(dates.startDate)} – ${fmt(dates.endDate)}`;
  }

  onPresetChange(_event: any) {
    if (this.selectedPreset !== 'custom') {
      const dates = this.getDateRange();
      if(dates.startDate && dates.endDate)
      {
        this.getMetrics();
      }
    }
  }

  onDateRangeChange() {
    if (this.customDateRange?.length === 2 && this.customDateRange[0] && this.customDateRange[1]) {
      this.getMetrics();
    }
  }
 
  // private tableDataMap: Record<string, ModalTableData> = {
  //   totalLeads: {
  //     title: '# Total SBX Leads',
  //     headers: ['#', 'Lead Name', 'Date', 'Source', 'Phone', 'Status'],
  //     rows: [
  //       [1, 'James Anderson', 'Jan 03, 2024', 'Google Ads', '(555) 101-2030', 'Converted'],
  //       [2, 'Maria Garcia', 'Jan 05, 2024', 'Facebook', '(555) 202-3141', 'Active'],
  //       [3, 'Robert Wilson', 'Jan 07, 2024', 'Google Ads', '(555) 303-4252', 'Converted'],
  //       [4, 'Emily Davis', 'Jan 09, 2024', 'Instagram', '(555) 404-5363', 'Active'],
  //       [5, 'Michael Brown', 'Jan 11, 2024', 'Google Ads', '(555) 505-6474', 'Lost'],
  //       [6, 'Ashley Martinez', 'Jan 13, 2024', 'Referral', '(555) 606-7585', 'Converted'],
  //       [7, 'David Taylor', 'Jan 15, 2024', 'Facebook', '(555) 707-8696', 'Active'],
  //       [8, 'Jessica Thomas', 'Jan 17, 2024', 'Google Ads', '(555) 808-9707', 'Converted'],
  //       [9, 'Christopher Lee', 'Jan 19, 2024', 'Instagram', '(555) 909-0818', 'Active'],
  //       [10, 'Amanda Jackson', 'Jan 21, 2024', 'Google Ads', '(555) 010-1929', 'Converted'],
  //       [11, 'Daniel White', 'Jan 23, 2024', 'Referral', '(555) 111-2030', 'Active'],
  //       [12, 'Stephanie Harris', 'Jan 25, 2024', 'Facebook', '(555) 212-3141', 'Converted'],
  //       [13, 'Matthew Clark', 'Jan 27, 2024', 'Google Ads', '(555) 313-4252', 'Lost'],
  //       [14, 'Lauren Lewis', 'Jan 29, 2024', 'Instagram', '(555) 414-5363', 'Active'],
  //       [15, 'Andrew Robinson', 'Feb 01, 2024', 'Google Ads', '(555) 515-6474', 'Converted'],
  //     ],
  //   },
  //   totalAdSpend: {
  //     title: 'Total Ad Spend',
  //     headers: ['Campaign', 'Platform', 'Budget', 'Spend', 'Impressions', 'Clicks', 'CTR'],
  //     rows: [
  //       ['Spring Promo', 'Google Ads', '$ 3,000.00', '$ 2,891.20', '48,200', '1,024', '2.12 %'],
  //       ['Brand Awareness', 'Facebook', '$ 2,500.00', '$ 2,443.55', '62,100', '876', '1.41 %'],
  //       ['Retargeting', 'Google Ads', '$ 1,800.00', '$ 1,756.30', '21,400', '632', '2.95 %'],
  //       ['Summer Campaign', 'Instagram', '$ 2,000.00', '$ 1,988.72', '35,800', '712', '1.99 %'],
  //       ['Local Search', 'Google Ads', '$ 1,500.00', '$ 1,492.40', '19,600', '488', '2.49 %'],
  //       ['Social Boost', 'Facebook', '$ 1,200.00', '$ 1,198.60', '28,300', '394', '1.39 %'],
  //       ['Display Ads', 'Google Ads', '$ 800.00', '$ 785.00', '44,100', '268', '0.61 %'],
  //       ['Email Retarget', 'Facebook', '$ 600.00', '$ 718.00', '15,200', '310', '2.04 %'],
  //     ],
  //   },
  //   avgCpl: {
  //     title: 'Average Cost Per Lead (CPL)',
  //     headers: ['Channel', 'Leads', 'Total Spend', 'CPL', 'Conv. Rate'],
  //     rows: [
  //       ['Google Ads', '42', '$ 5,924.90', '$ 141.07', '46.7 %'],
  //       ['Facebook', '28', '$ 4,360.15', '$ 155.72', '31.1 %'],
  //       ['Instagram', '12', '$ 1,988.72', '$ 165.73', '13.3 %'],
  //       ['Referral', '8', '$ 1,000.00', '$ 125.00', '8.9 %'],
  //       ['Total', '90', '$ 13,273.77', '$ 147.49', '100 %'],
  //     ],
  //   },
  //   leadsAbandoned: {
  //     title: '# Leads Abandoned',
  //     headers: ['Lead Name', 'Date', 'Source', 'Step Abandoned', 'Time Spent', 'Follow-Up'],
  //     rows: [
  //       [
  //         'Kevin Mitchell',
  //         'Feb 14, 2024',
  //         'Google Ads',
  //         'Appointment Scheduling',
  //         '3 min',
  //         'Pending',
  //       ],
  //     ],
  //   },
  //   speedToLead: {
  //     title: 'Speed To Lead',
  //     headers: [
  //       'Lead Name',
  //       'Received At',
  //       'First Contact',
  //       'Response (Hours)',
  //       'Response (Mins)',
  //       'Channel',
  //     ],
  //     rows: [
  //       ['James Anderson', 'Jan 03, 09:14 AM', 'Jan 03, 11:22 AM', '2.1', '128', 'Phone'],
  //       ['Maria Garcia', 'Jan 05, 08:45 AM', 'Jan 05, 10:30 AM', '1.8', '105', 'Email'],
  //       ['Robert Wilson', 'Jan 07, 01:00 PM', 'Jan 08, 07:30 AM', '18.5', '1,110', 'Phone'],
  //       ['Emily Davis', 'Jan 09, 03:20 PM', 'Jan 09, 06:45 PM', '3.4', '205', 'SMS'],
  //       ['Michael Brown', 'Jan 11, 10:00 AM', 'Jan 12, 08:00 AM', '22.0', '1,320', 'Phone'],
  //       ['Ashley Martinez', 'Jan 13, 02:15 PM', 'Jan 13, 04:00 PM', '1.8', '105', 'Email'],
  //       ['David Taylor', 'Jan 15, 11:30 AM', 'Jan 15, 02:10 PM', '2.7', '160', 'Phone'],
  //       ['Jessica Thomas', 'Jan 17, 09:00 AM', 'Jan 17, 09:45 AM', '0.75', '45', 'Phone'],
  //       ['Christopher Lee', 'Jan 19, 04:00 PM', 'Jan 20, 09:00 AM', '17.0', '1,020', 'Email'],
  //       ['Amanda Jackson', 'Jan 21, 12:00 PM', 'Jan 21, 01:30 PM', '1.5', '90', 'SMS'],
  //     ],
  //   },
  //   leadsBooked: {
  //     title: '# Leads Booked',
  //     headers: ['Patient Name', 'Booked Date', 'Appt Date', 'Doctor', 'Service', 'Status'],
  //     rows: [
  //       [
  //         'James Anderson',
  //         'Jan 04, 2024',
  //         'Jan 15, 2024',
  //         'Dr. Patel',
  //         'Consultation',
  //         'Completed',
  //       ],
  //       ['Maria Garcia', 'Jan 06, 2024', 'Jan 18, 2024', 'Dr. Chen', 'Follow-Up', 'Completed'],
  //       ['Robert Wilson', 'Jan 08, 2024', 'Jan 20, 2024', 'Dr. Patel', 'Consultation', 'Completed'],
  //       ['Ashley Martinez', 'Jan 14, 2024', 'Jan 25, 2024', 'Dr. Lee', 'Treatment', 'Completed'],
  //       ['David Taylor', 'Jan 16, 2024', 'Jan 28, 2024', 'Dr. Chen', 'Consultation', 'Completed'],
  //       ['Jessica Thomas', 'Jan 18, 2024', 'Jan 30, 2024', 'Dr. Patel', 'Follow-Up', 'Completed'],
  //       ['Amanda Jackson', 'Jan 22, 2024', 'Feb 02, 2024', 'Dr. Lee', 'Treatment', 'Completed'],
  //       ['Daniel White', 'Jan 24, 2024', 'Feb 05, 2024', 'Dr. Chen', 'Consultation', 'Completed'],
  //       ['Stephanie Harris', 'Jan 26, 2024', 'Feb 07, 2024', 'Dr. Patel', 'Follow-Up', 'Completed'],
  //       ['Andrew Robinson', 'Feb 02, 2024', 'Feb 12, 2024', 'Dr. Lee', 'Treatment', 'Completed'],
  //       ['Lauren Lewis', 'Jan 30, 2024', 'Feb 09, 2024', 'Dr. Chen', 'Consultation', 'Scheduled'],
  //       ['Matthew Clark', 'Jan 28, 2024', 'Feb 14, 2024', 'Dr. Patel', 'Follow-Up', 'Scheduled'],
  //       ['Emily Davis', 'Jan 10, 2024', 'Jan 22, 2024', 'Dr. Lee', 'Consultation', 'Completed'],
  //       ['Christopher Lee', 'Jan 20, 2024', 'Feb 01, 2024', 'Dr. Chen', 'Treatment', 'Completed'],
  //       ['Kevin Mitchell', 'Jan 12, 2024', 'Jan 24, 2024', 'Dr. Patel', 'Consultation', 'No-Show'],
  //       ['Sandra Collins', 'Jan 28, 2024', 'Feb 08, 2024', 'Dr. Lee', 'Follow-Up', 'Scheduled'],
  //     ],
  //   },
  //   leadsFta: {
  //     title: '# Leads FTA (Failure To Attend)',
  //     headers: ['Patient Name', 'Appt Date', 'Doctor', 'Service', 'Notified', 'Rescheduled'],
  //     rows: [['Kevin Mitchell', 'Jan 24, 2024', 'Dr. Patel', 'Consultation', 'Yes', 'Pending']],
  //   },
  //   leadsWon: {
  //     title: '# Lead Lost',
  //     headers: ['Lead Name', 'Date Lost', 'Source', 'Reason', 'Value', 'Follow-Up'],
  //     rows: [
  //       ['Michael Brown', 'Jan 19, 2024', 'Google Ads', 'Chose Competitor', '$ 8,500', 'No'],
  //       ['Matthew Clark', 'Feb 01, 2024', 'Google Ads', 'Price Concern', '$ 6,200', 'Yes'],
  //       ['Sandra Collins', 'Jan 10, 2024', 'Facebook', 'Not Interested', '$ 4,800', 'No'],
  //       ['Brian Scott', 'Jan 12, 2024', 'Instagram', 'Timing Issue', '$ 9,100', 'Yes'],
  //       ['Karen Young', 'Jan 14, 2024', 'Referral', 'Chose Competitor', '$ 7,300', 'No'],
  //       ['Steven Adams', 'Jan 16, 2024', 'Google Ads', 'Price Concern', '$ 5,600', 'Yes'],
  //       ['Patricia Hall', 'Jan 18, 2024', 'Facebook', 'Not Interested', '$ 3,900', 'No'],
  //       ['Thomas Nelson', 'Jan 20, 2024', 'Google Ads', 'Timing Issue', '$ 8,200', 'No'],
  //       ['Linda Carter', 'Jan 22, 2024', 'Instagram', 'Chose Competitor', '$ 6,700', 'Yes'],
  //       ['Charles Evans', 'Jan 24, 2024', 'Referral', 'Price Concern', '$ 5,100', 'No'],
  //       ['Betty Turner', 'Jan 26, 2024', 'Google Ads', 'Not Interested', '$ 4,400', 'No'],
  //       ['George Phillips', 'Jan 28, 2024', 'Facebook', 'Timing Issue', '$ 7,800', 'Yes'],
  //       ['Dorothy Campbell', 'Jan 30, 2024', 'Google Ads', 'Chose Competitor', '$ 9,500', 'No'],
  //       ['Richard Parker', 'Feb 02, 2024', 'Instagram', 'Price Concern', '$ 6,000', 'Yes'],
  //       ['Barbara Edwards', 'Feb 04, 2024', 'Google Ads', 'Not Interested', '$ 3,200', 'No'],
  //       ['Joseph Collins', 'Feb 06, 2024', 'Referral', 'Timing Issue', '$ 5,500', 'No'],
  //       ['Carol Stewart', 'Feb 08, 2024', 'Google Ads', 'Chose Competitor', '$ 8,800', 'Yes'],
  //       ['Paul Sanchez', 'Feb 10, 2024', 'Facebook', 'Price Concern', '$ 4,900', 'No'],
  //     ],
  //   },
  //   treatmentAccepted: {
  //     title: 'Treatment Accepted',
  //     headers: ['Patient', 'Treatment', 'Date', 'Doctor', 'Value', 'Payment'],
  //     rows: [
  //       [
  //         'James Anderson',
  //         'Full Smile Makeover',
  //         'Jan 15, 2024',
  //         'Dr. Patel',
  //         '$ 28,500',
  //         'Financed',
  //       ],
  //       ['Maria Garcia', 'Orthodontic Treatment', 'Jan 18, 2024', 'Dr. Chen', '$ 18,200', 'Cash'],
  //       ['Robert Wilson', 'Implant + Crown', 'Jan 20, 2024', 'Dr. Patel', '$ 24,100', 'Insurance'],
  //       ['Ashley Martinez', 'Veneers (8)', 'Jan 25, 2024', 'Dr. Lee', '$ 16,800', 'Financed'],
  //       ['David Taylor', 'All-on-4 Implants', 'Jan 28, 2024', 'Dr. Chen', '$ 42,000', 'Financed'],
  //       ['Jessica Thomas', 'Invisalign Full', 'Jan 30, 2024', 'Dr. Patel', '$ 6,500', 'Insurance'],
  //       ['Amanda Jackson', 'Crown x3', 'Feb 02, 2024', 'Dr. Lee', '$ 8,100', 'Cash'],
  //       ['Daniel White', 'Whitening + Bonding', 'Feb 05, 2024', 'Dr. Chen', '$ 4,200', 'Cash'],
  //       ['Stephanie Harris', 'Implant Single', 'Feb 07, 2024', 'Dr. Patel', '$ 5,900', 'Insurance'],
  //       ['Andrew Robinson', 'Porcelain Bridge', 'Feb 12, 2024', 'Dr. Lee', '$ 12,400', 'Financed'],
  //       ['Emily Davis', 'Gum Contouring', 'Jan 22, 2024', 'Dr. Lee', '$ 3,800', 'Cash'],
  //       [
  //         'Christopher Lee',
  //         'Sleep Apnea Device',
  //         'Feb 01, 2024',
  //         'Dr. Chen',
  //         '$ 7,600',
  //         'Insurance',
  //       ],
  //       ['Lauren Lewis', 'Clear Aligners', 'Feb 09, 2024', 'Dr. Patel', '$ 5,400', 'Financed'],
  //       ['Sandra Collins', 'Full Restoration', 'Jan 08, 2024', 'Dr. Lee', '$ 38,500', 'Financed'],
  //       ['Brian Scott', 'Implant + Sinus Lift', 'Jan 10, 2024', 'Dr. Chen', '$ 31,738', 'Financed'],
  //     ],
  //   },
  //   costPerAcquisition: {
  //     title: 'Cost Per Acquisition',
  //     headers: ['Channel', 'Leads', 'Converted', 'Conv. Rate', 'Total Spend', 'CPA'],
  //     rows: [
  //       ['Google Ads', '42', '8', '19.0 %', '$ 5,924.90', '$ 740.61'],
  //       ['Facebook', '28', '4', '14.3 %', '$ 4,360.15', '$ 1,090.04'],
  //       ['Instagram', '12', '2', '16.7 %', '$ 1,988.72', '$ 994.36'],
  //       ['Referral', '8', '1', '12.5 %', '$ 1,000.00', '$ 1,000.00'],
  //       ['Total', '90', '15', '16.7 %', '$ 13,273.77', '$ 884.92'],
  //     ],
  //   },
  //   returnOnAdSpend: {
  //     title: 'Return On Ad Spend',
  //     headers: ['Campaign', 'Ad Spend', 'Revenue Generated', 'ROAS', 'Conversions'],
  //     rows: [
  //       ['Spring Promo', '$ 2,891.20', '$ 70,500', '24.39 x', '4'],
  //       ['Brand Awareness', '$ 2,443.55', '$ 59,600', '24.39 x', '3'],
  //       ['Retargeting', '$ 1,756.30', '$ 42,800', '24.39 x', '3'],
  //       ['Summer Campaign', '$ 1,988.72', '$ 48,500', '24.39 x', '2'],
  //       ['Local Search', '$ 1,492.40', '$ 36,400', '24.39 x', '2'],
  //       ['Social Boost', '$ 1,198.60', '$ 29,200', '24.39 x', '1'],
  //       ['Display Ads', '$ 785.00', '$ 19,138', '24.39 x', '0'],
  //       ['Email Retarget', '$ 718.00', '$ 17,600', '24.39 x', '0'],
  //       ['Total', '$ 13,273.77', '$ 323,738', '24.39 x', '15'],
  //     ],
  //   },
  //   opportunityPipeline: {
  //     title: 'Opportunity Pipeline',
  //     headers: ['Patient', 'Proposed Treatment', 'Value', 'Stage', 'Doctor', 'Next Steps'],
  //     rows: [
  //       [
  //         'Lauren Lewis',
  //         'Clear Aligners + Whitening',
  //         '$ 7,200',
  //         'Proposal Sent',
  //         'Dr. Patel',
  //         'Follow-Up Call',
  //       ],
  //       [
  //         'Matthew Clark',
  //         'All-on-4 Implants',
  //         '$ 42,000',
  //         'Consultation Done',
  //         'Dr. Chen',
  //         'Treatment Plan',
  //       ],
  //       [
  //         'Sandra Collins',
  //         'Veneers (6) + Crowns',
  //         '$ 21,600',
  //         'In Negotiation',
  //         'Dr. Lee',
  //         'Send Quote',
  //       ],
  //       ['Brian Scott', 'Orthodontics', '$ 18,200', 'Proposal Sent', 'Dr. Patel', 'Wait Decision'],
  //       [
  //         'Karen Young',
  //         'Implants x2',
  //         '$ 15,800',
  //         'Consultation Done',
  //         'Dr. Chen',
  //         'Treatment Plan',
  //       ],
  //       [
  //         'Steven Adams',
  //         'Smile Makeover',
  //         '$ 32,500',
  //         'In Negotiation',
  //         'Dr. Lee',
  //         'Follow-Up Call',
  //       ],
  //       [
  //         'Christopher Lee',
  //         'Bone Graft + Implant',
  //         '$ 18,125',
  //         'Proposal Sent',
  //         'Dr. Patel',
  //         'Awaiting Approval',
  //       ],
  //       [
  //         'Emily Davis',
  //         'Gum Surgery + Crowns',
  //         '$ 11,700',
  //         'Consultation Done',
  //         'Dr. Chen',
  //         'Send Quote',
  //       ],
  //     ],
  //   },
  // };

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
      return;
    }
    this.currentModalLoader = null;
    // this.activeModal = this.tableDataMap[cardId] ?? null;
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
    const { startDate, endDate } = this.getDateRange();
    const params = {
      access_token: this.YOUR_ACCESS_TOKEN,
      start_date: startDate ? this.toStartOfDay(startDate) : '',
      end_date:   endDate   ? this.toEndOfDay(endDate)     : '',
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
