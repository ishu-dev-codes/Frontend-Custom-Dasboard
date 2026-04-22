import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import {
  ClientAccountsService,
  ClientAccount,
  ClientAccountPayload,
} from '../../core/services/client-accounts.service';
import { HeaderComponent } from '../../shared/components/header.component/header.component';

@Component({
  selector: 'app-client-accounts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ConfirmDialogModule,
    ToastModule,
    HeaderComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './client-accounts.component.html',
  styleUrl: './client-accounts.component.scss',
})
export class ClientAccountsComponent implements OnInit {
  private readonly service = inject(ClientAccountsService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  readonly router = inject(Router);

  accounts: ClientAccount[] = [];
  isLoading = false;

  dialogVisible = false;
  isSaving = false;
  editingId: number | null = null;

  form: ClientAccountPayload = {
    client_name: '',
    location_id: '',
    ad_account_id: '',
    ad_account_name: '',
  };

  ngOnInit() {
    this.loadAccounts();
  }

  loadAccounts() {
    this.isLoading = true;
    this.service.getAll().subscribe({
      next: data => {
        this.accounts = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load accounts' });
      },
    });
  }

  openCreate() {
    this.editingId = null;
    this.form = { client_name: '', location_id: '', ad_account_id: '', ad_account_name: '' };
    this.dialogVisible = true;
  }

  openEdit(account: ClientAccount) {
    this.editingId = account.id;
    this.form = {
      client_name: account.client_name,
      location_id: account.location_id,
      ad_account_id: account.ad_account_id,
      ad_account_name: account.ad_account_name,
    };
    this.dialogVisible = true;
  }

  saveAccount() {
    if (!this.form.client_name.trim() || !this.form.location_id.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Client name and Location ID are required' });
      return;
    }

    this.isSaving = true;
    const request$ = this.editingId !== null
      ? this.service.update(this.editingId, this.form)
      : this.service.create(this.form);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.dialogVisible = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.editingId !== null ? 'Account updated' : 'Account created',
        });
        this.loadAccounts();
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save account' });
      },
    });
  }

  confirmDelete(account: ClientAccount) {
    this.confirmationService.confirm({
      message: `Delete "${account.client_name}"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteAccount(account.id),
    });
  }

  private deleteAccount(id: number) {
    this.service.delete(id).subscribe({
      next: () => {
        this.accounts = this.accounts.filter(a => a.id !== id);
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Account removed' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete account' });
      },
    });
  }

  get dialogTitle(): string {
    return this.editingId !== null ? 'Edit Account' : 'New Account';
  }
}
