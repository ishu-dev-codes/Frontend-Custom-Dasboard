import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';

export interface RoiCardExtra {
  label: string;
  value: string;
  color?: 'green' | 'red';
}

export interface RoiCardData {
  id: string;
  title: string;
  value: string;
  infoText?: string;
  extras?: RoiCardExtra[];
  clickable?: boolean;
}

@Component({
  selector: 'app-roi-card',
  standalone: true,
  templateUrl: './roi-card.component.html',
  styleUrl: './roi-card.component.scss',
})
export class RoiCardComponent {
  @Input() data!: RoiCardData;
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
