import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ClientAccountsService } from '../../core/services/client-accounts.service';
import {
  ClientAccount,
  ClientAccountPayload,
  ClientStatusKey,
  PipelineStages,
} from '../../core/models/client-account.model';
import {
  adAccountIdValidator,
  DEFAULT_STAGES,
  MAX_STAGES,
  STATUS_KEYS,
} from '../../core/constants/client-account.consts';
import { HeaderComponent } from '../../shared/components/header.component/header.component';

@Component({
  selector: 'app-client-accounts',
  standalone: true,
  imports: [
 CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MultiSelectModule,
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
  private readonly fb = inject(FormBuilder);
  readonly router = inject(Router);

  accounts: ClientAccount[] = [];
  isLoading = false;

  dialogVisible = false;
  isSaving = false;
  editingId: number | null = null;
  showGuide = false;

  metaTokenDialogVisible = false;
  metaTokenValue = '';
  metaTokenMasked = true;
  isLoadingMetaToken = false;
  isSavingMetaToken = false;

  readonly defaultStages = DEFAULT_STAGES;

  readonly statusOptions = STATUS_KEYS.map((k) => ({ label: k, value: k }));
  readonly maxStages = MAX_STAGES;
  readonly statusKeys = STATUS_KEYS;

  form!: FormGroup;

  ngOnInit() {
    this.initForm();
    this.loadAccounts();
  }

  private initForm() {
    this.form = this.fb.group({
      client_name: ['', Validators.required],
      location_id: ['', Validators.required],
      ad_account_id: ['', adAccountIdValidator],
      ad_account_name: [''],
      token: [''],
      image_url: [''],
      selectedStatuses: [[]],
      stages: this.fb.group({
        Booked: this.fb.array([]),
        Won: this.fb.array([]),
        Cancelled: this.fb.array([]),
      }),
    });
  }

  private resetForm() {
    this.form.reset({
      client_name: '',
      location_id: '',
      ad_account_id: '',
      ad_account_name: '',
      token: '',
      image_url: '',
      selectedStatuses: [],
    });
    for (const key of STATUS_KEYS) {
      this.getStageArray(key).clear();
    }
  }

  // --- FormArray helpers ---

  getStageArray(status: ClientStatusKey): FormArray {
    return (this.form.get('stages') as FormGroup).get(status) as FormArray;
  }

  getStageControls(status: ClientStatusKey): AbstractControl[] {
    return this.getStageArray(status).controls;
  }

  get selectedStatuses(): ClientStatusKey[] {
    return this.form.get('selectedStatuses')?.value ?? [];
  }

  // --- Account loading ---

  loadAccounts() {
    this.isLoading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.accounts = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load accounts' });
      },
    });
  }

  // --- Dialog open ---

  openCreate() {
    this.editingId = null;
    this.resetForm();
    this.dialogVisible = true;
  }

  openEdit(account: ClientAccount) {
    this.editingId = account.id;
    this.resetForm();

    const selected: ClientStatusKey[] = [];
    const ps: PipelineStages = account.pipeline_stages ?? {};

    for (const key of STATUS_KEYS) {
      const stages = ps[key];
      if (stages && stages.length > 0) {
        selected.push(key);
        for (const stage of stages) {
          this.getStageArray(key).push(this.fb.control(stage, Validators.required));
        }
      }
    }

    this.form.patchValue({
      client_name: account.client_name,
      location_id: account.location_id,
      ad_account_id: account.ad_account_id,
      ad_account_name: account.ad_account_name,
      token: '',
      image_url: account.image_url ?? '',
      selectedStatuses: selected,
    });

    this.dialogVisible = true;
  }

  // --- Status change ---

  onStatusChange() {
    const selected: ClientStatusKey[] = this.form.get('selectedStatuses')?.value ?? [];
    for (const key of STATUS_KEYS) {
      const arr = this.getStageArray(key);
      if (selected.includes(key)) {
        if (arr.length === 0) arr.push(this.fb.control('', Validators.required));
      } else {
        arr.clear();
      }
    }
  }

  // --- Stage management ---

  addStage(status: ClientStatusKey) {
    const arr = this.getStageArray(status);
    if (arr.length < MAX_STAGES) {
      arr.push(this.fb.control('', Validators.required));
    }
  }

  removeStage(status: ClientStatusKey, index: number) {
    const arr = this.getStageArray(status);
    arr.removeAt(index);
    if (arr.length === 0) {
      arr.push(this.fb.control('', Validators.required));
    }
  }

  // --- Validation helpers ---

  isFieldInvalid(fieldName: string): boolean {
    const ctrl = this.form.get(fieldName);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  getFieldError(fieldName: string): string {
    const ctrl = this.form.get(fieldName);
    if (!ctrl || !ctrl.touched || !ctrl.errors) return '';
    if (ctrl.errors['required']) return `${this.fieldLabel(fieldName)} is required`;
    if (ctrl.errors['adAccountIdFormat']) return 'Must follow format: act_1234567890';
    return '';
  }

  isStageInvalid(status: ClientStatusKey, index: number): boolean {
    const ctrl = this.getStageArray(status).at(index);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  stageGroupError(status: ClientStatusKey): string {
    const arr = this.getStageArray(status);
    const anyTouched = arr.controls.some(c => c.touched);
    if (!anyTouched) return '';
    const allEmpty = arr.controls.every(c => !c.value?.trim());
    return allEmpty ? 'At least one stage name is required' : '';
  }

  private fieldLabel(name: string): string {
    const labels: Record<string, string> = {
      client_name: 'Client name',
      location_id: 'Location ID',
    };
    return labels[name] ?? name;
  }
  
saveAccount() {
  this.form.markAllAsTouched();
  if (this.form.invalid) return;

  const raw = this.form.value;

  const pipeline_stages: { Booked: string[]; Won: string[]; Cancelled: string[] } = {
    Booked: [],
    Won: [],
    Cancelled: [],
  };

  for (const key of STATUS_KEYS) {
    const payloadKey = key as 'Booked' | 'Won' | 'Cancelled';
    const selected: ClientStatusKey[] = raw.selectedStatuses ?? [];
    if (selected.includes(key)) {
      pipeline_stages[payloadKey] = (this.getStageArray(key).value as string[]).filter(s => s?.trim());
    } else {
      pipeline_stages[payloadKey] = [];
    }
  }

  const payload: ClientAccountPayload = {
    client_name: raw.client_name,
    location_id: raw.location_id,
    ad_account_id: raw.ad_account_id,
    ad_account_name: raw.ad_account_name,
    pipeline_stages,
  };

  if (raw.token?.trim()) {
    payload.token = raw.token;
  }

  if (raw.image_url?.trim()) {
    payload.image_url = raw.image_url;
  }

  this.isSaving = true;
  const request$ = this.editingId !== null
    ? this.service.update(this.editingId, payload)
    : this.service.create(payload);

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
        this.accounts = this.accounts.filter((a) => a.id !== id);
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Account removed' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete account' });
      },
    });
  }

  // --- Utilities ---

  stageSummary(account: ClientAccount): string {
    const ps = account.pipeline_stages;
    if (!ps) return '—';
    const parts = STATUS_KEYS.map((key) => ({ key, count: ps[key]?.length ?? 0 }))
      .filter(({ count }) => count > 0)
      .map(({ key, count }) => `${key}: ${count}`);
    return parts.length > 0 ? parts.join(' · ') : '—';
  }

  get dialogTitle(): string {
    return this.editingId !== null ? 'Edit Account' : 'New Account';
  }

  // --- Meta Token ---

  openMetaTokenDialog() {
    this.metaTokenDialogVisible = true;
    this.metaTokenValue = '';
    this.metaTokenMasked = true;
    this.isLoadingMetaToken = true;
    this.service.getMetaToken().subscribe({
      next: (res) => {
        this.metaTokenValue = res.token ?? '';
        this.isLoadingMetaToken = false;
      },
      error: () => {
        this.isLoadingMetaToken = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load meta token' });
      },
    });
  }

  saveMetaToken() {
    const token = this.metaTokenValue.trim();
    if (!token) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Token cannot be empty' });
      return;
    }
    this.isSavingMetaToken = true;
    this.service.updateMetaToken(token).subscribe({
      next: () => {
        this.isSavingMetaToken = false;
        this.metaTokenDialogVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Meta token updated' });
      },
      error: () => {
        this.isSavingMetaToken = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update meta token' });
      },
    });
  }

  // --- CSV Export ---

  exportAccountsCsv() {
    const headers = ['ID', 'Client Name', 'Ad Account Name', 'Ad Account ID', 'Location ID', 'Pipeline Stages'];
    const rows = this.accounts.map((a) => [
      a.id,
      a.client_name,
      a.ad_account_name ?? '',
      a.ad_account_id ?? '',
      a.location_id,
      this.stageSummary(a),
    ]);
    this.downloadCsv('client-accounts.csv', headers, rows);
  }

  private downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
    const escape = (v: string | number) => {
      const s = String(v ?? '');
      return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
