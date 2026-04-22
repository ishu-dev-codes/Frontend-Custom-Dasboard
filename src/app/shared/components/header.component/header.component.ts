import { Component, EventEmitter, HostListener, inject, OnInit, Output } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
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

  @Output() dateRangeChanged = new EventEmitter<DateRange>();

  profileMenuOpen = false;
  logoUrl = '';
  readonly showClientAccounts = localStorage.getItem('location_id') === 'wLbWopWGch5Col0WyuJd';

  datePresets = [
    { label: 'This Week', value: 'this_week' },
    { label: 'Last Week', value: 'last_week' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'Last 3 Months', value: 'last_3_months' },
    { label: 'Last Year', value: 'last_year' },
    { label: 'Custom Range', value: 'custom' },
  ];

  selectedPreset = 'last_month';
  customDateRange: Date[] | null = null;

  ngOnInit() {
    this.logoUrl = new URLSearchParams(window.location.search).get('logoUrl') || '';
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

  // getDateRange(): DateRange {
  //   const now = new Date();

  //   switch (this.selectedPreset) {
  //     case 'this_week': {
  //       const start = new Date(now);
  //       start.setDate(now.getDate() - now.getDay());
  //       return { startDate: start, endDate: now };
  //     }
  //     case 'last_week': {
  //       const start = new Date(now);
  //       start.setDate(now.getDate() - now.getDay() - 7);
  //       const end = new Date(start);
  //       end.setDate(start.getDate() + 6);
  //       return { startDate: start, endDate: end };
  //     }
  //     case 'last_month': {
  //       const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  //       const end = new Date(now.getFullYear(), now.getMonth(), 0);
  //       return { startDate: start, endDate: end };
  //     }
  //     case 'last_3_months': {
  //       const start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  //       // const end = new Date(now.getFullYear(), now.getMonth() - 1, (now.getMonth() - 1));
  //       return { startDate: start, endDate: now };
  //     }
  //     case 'last_year': {
  //       const start = new Date(now.getFullYear() - 1, 0, 1);
  //       const end = new Date(now.getFullYear() - 1, 11, 31);
  //       return { startDate: start, endDate: end };
  //     }
  //     case 'custom': {
  //       if (this.customDateRange?.length === 2) {
  //         return { startDate: this.customDateRange[0], endDate: this.customDateRange[1] };
  //       }
  //       return { startDate: null, endDate: null };
  //     }
  //     default:
  //       return { startDate: null, endDate: null };
  //   }
  // }
getDateRange(): DateRange {
  const now = new Date();

  switch (this.selectedPreset) {

    // ✅ THIS WEEK (Mon → Today)
    case 'this_week': {
      const start = new Date(now);

      const day = now.getDay(); // 0 (Sun) → 6 (Sat)
      const diff = (day === 0 ? -6 : 1 - day); // shift to Monday

      start.setDate(now.getDate() + diff);

      return { startDate: start, endDate: now };
    }

    // ✅ LAST WEEK (Mon → Sun)
    case 'last_week': {
      const currentDay = now.getDay();
      const diffToMonday = (currentDay === 0 ? -6 : 1 - currentDay);

      // Monday of current week
      const thisWeekMonday = new Date(now);
      thisWeekMonday.setDate(now.getDate() + diffToMonday);

      // Last week Monday
      const start = new Date(thisWeekMonday);
      start.setDate(thisWeekMonday.getDate() - 7);

      // Last week Sunday
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      return { startDate: start, endDate: end };
    }

    // ✅ LAST MONTH (FULL)
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: start, endDate: end };
    }

    // ✅ LAST 3 MONTHS (ROLLING SAME DATE)
    case 'last_3_months': {
      const start = new Date(now);
      start.setMonth(now.getMonth() - 3);

      return { startDate: start, endDate: now };
    }

    // ✅ LAST YEAR (FULL)
    case 'last_year': {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31);
      return { startDate: start, endDate: end };
    }

    // ✅ CUSTOM
    case 'custom': {
      if (this.customDateRange?.length === 2) {
        return {
          startDate: this.customDateRange[0],
          endDate: this.customDateRange[1]
        };
      }
      return { startDate: null, endDate: null };
    }

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
      if (dates.startDate && dates.endDate) {
        this.emitDateRange();
      }
    }
  }

  onDateRangeChange() {
    if (this.customDateRange?.length === 2 && this.customDateRange[0] && this.customDateRange[1]) {
      this.emitDateRange();
    }
  }

  private emitDateRange() {
    this.dateRangeChanged.emit(this.getDateRange());
  }
}
