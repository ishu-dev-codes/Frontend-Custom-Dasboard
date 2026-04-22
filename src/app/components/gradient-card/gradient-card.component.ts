import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Card } from 'primeng/card';

export interface GradientCardData {
  id: string;
  title: string;
  value: string;
  // gradientIndex: 1 | 2 | 3 | 4;
  info?: string;
  innerBox?: { label: string; value: string, color: 'green' | 'red' };
  clickable?: boolean;
}

@Component({
  selector: 'app-gradient-card',
  standalone: true,
  imports: [Card],
  templateUrl: './gradient-card.component.html',
  styleUrl: './gradient-card.component.scss'
})
export class GradientCardComponent {
  @Input() data!: GradientCardData;
  @Output() cardClick = new EventEmitter<void>();

  showInfo = false;

  private readonly gradients: Record<number, string> = {
    1: '#fff',
    2: '#fff',
    3: '#fff',
    4: '#fff',
  };

  // get cardStyle() {
  //   return { background: this.gradients[this.data.gradientIndex], height: '100%' };
  // }

  toggleInfo(event: MouseEvent) {
    event.stopPropagation();
    this.showInfo = !this.showInfo;
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.showInfo) this.showInfo = false;
  }
}
