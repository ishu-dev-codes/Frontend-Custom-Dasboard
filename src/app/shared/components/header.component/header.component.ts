import { Component, EventEmitter, HostListener, inject, OnInit, Output } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { HttpService } from '../../../core/services/http.service';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface BrandingResponse {
  client_name: string;
  location_id: string;
  image_url: string;
  id: number;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [Select, DatePicker, CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly router = inject(Router);
  private readonly http = inject(HttpService);

  @Output() dateRangeChanged = new EventEmitter<DateRange>();

  profileMenuOpen = false;
  logoUrl = '';
  readonly showClientAccounts = localStorage.getItem('location_id') === 'wLbWopWGch5Col0WyuJd';

  datePresets = [
    { label: 'This Week', value: 'this_week' },
    { label: 'Last Week', value: 'last_week' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'Last 3 Months', value: 'last_3_months' },
    { label: 'This Year', value: 'this_year' },
    { label: 'Last Year', value: 'last_year' },
    { label: 'Custom Range', value: 'custom' },
  ];

  selectedPreset = 'last_month';
  calendarDateRange: Date[] | null = null;
  showGoButton = false;

  ngOnInit() {
    const locationId = localStorage.getItem('location_id');
    if (locationId) {
      this.http.get<BrandingResponse>(`branding/${locationId}`).subscribe({
        next: (res) => { this.logoUrl = res.image_url; },
        error: () => { this.logoUrl = ''; },
      });
    }
    this.syncCalendarToPreset();
    this.emitDateRange();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-menu-wrapper')) {
      this.profileMenuOpen = false;
    }
  }

  toggleProfileMenu() {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  logout() {
    this.profileMenuOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private calcPresetRange(preset: string): { startDate: Date; endDate: Date } | null {
    const now = new Date();

    switch (preset) {
      case 'this_week': {
        const start = new Date(now);
        const day = now.getDay();
        start.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
        return { startDate: start, endDate: now };
      }
      case 'last_week': {
        const currentDay = now.getDay();
        const thisMonday = new Date(now);
        thisMonday.setDate(now.getDate() + (currentDay === 0 ? -6 : 1 - currentDay));
        const start = new Date(thisMonday);
        start.setDate(thisMonday.getDate() - 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { startDate: start, endDate: end };
      }
      case 'this_month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startDate: start, endDate: now };
      }
      case 'last_month': {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { startDate: start, endDate: end };
      }
      case 'last_3_months': {
        const start = new Date(now);
        start.setMonth(now.getMonth() - 3);
        return { startDate: start, endDate: now };
      }
      case 'this_year': {
        const start = new Date(now.getFullYear(), 0, 1);
        return { startDate: start, endDate: now };
      }
      case 'last_year': {
        const start = new Date(now.getFullYear() - 1, 0, 1);
        const end = new Date(now.getFullYear() - 1, 11, 31);
        return { startDate: start, endDate: end };
      }
      default:
        return null;
    }
  }

  private syncCalendarToPreset() {
    const range = this.calcPresetRange(this.selectedPreset);
    if (range) {
      this.calendarDateRange = [range.startDate, range.endDate];
    }
  }

  getDateRange(): DateRange {
    if (this.calendarDateRange?.length === 2 && this.calendarDateRange[0] && this.calendarDateRange[1]) {
      return { startDate: this.calendarDateRange[0], endDate: this.calendarDateRange[1] };
    }
    return { startDate: null, endDate: null };
  }

  onPresetChange(_event: any) {
    if (this.selectedPreset === 'custom') {
      this.showGoButton = false;
      return;
    }
    this.syncCalendarToPreset();
    this.showGoButton = false;
    this.emitDateRange();
  }

  onCalendarDateChange() {
    if (this.calendarDateRange?.length === 2 && this.calendarDateRange[0] && this.calendarDateRange[1]) {
      this.showGoButton = true;
    }
  }

  onGoClick() {
    this.showGoButton = false;
    this.emitDateRange();
  }

  private emitDateRange() {
    this.dateRangeChanged.emit(this.getDateRange());
  }
}
