import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Paginator, PaginatorState } from 'primeng/paginator';

export interface ModalTableData {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  total?: number;
  page?: number;
  pageSize?: number;
  tableLoading?: boolean;
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [Dialog, TableModule, Button, Paginator, FormsModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  @Input() data!: ModalTableData;
  @Output() close = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<{ page: number; pageSize: number }>();

  visible = true;

  get first(): number {
    return ((this.data.page ?? 1) - 1) * (this.data.pageSize ?? 10);
  }

  get tableColumns(): { field: string; header: string }[] {
    return this.data.headers.map((h, i) => ({ field: `c${i}`, header: h }));
  }

  get tableRows(): Record<string, string | number>[] {
    const cols = this.tableColumns;
    return this.data.rows.map(row =>
      Object.fromEntries(cols.map((col, i) => [col.field, row[i]]))
    );
  }

  onPageChange(event: PaginatorState) {
    const pageSize = this.data.pageSize ?? 10;
    const newPage = Math.floor((event.first ?? 0) / pageSize) + 1;
    if (newPage !== (this.data.page ?? 1)) {
      this.pageChange.emit({ page: newPage, pageSize });
    }
  }

  onPageSizeChange(pageSize: number) {
    this.pageChange.emit({ page: 1, pageSize });
  }

  onVisibleChange(val: boolean) {
    if (!val) this.close.emit();
  }
}
