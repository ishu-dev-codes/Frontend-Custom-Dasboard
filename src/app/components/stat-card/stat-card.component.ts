import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Card } from 'primeng/card';

export interface StatCardData {
  id: string;
  title: string;
  value: string;
  info?: string;
  sub: { label: string; value: string; color: 'green' | 'red', };
}

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [Card],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  @Input() data!: StatCardData;
  @Output() cardClick = new EventEmitter<void>();

  showInfo = false;

  toggleInfo(event: MouseEvent) {
    event.stopPropagation();
    this.showInfo = !this.showInfo;
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.showInfo) this.showInfo = false;
  }
}
