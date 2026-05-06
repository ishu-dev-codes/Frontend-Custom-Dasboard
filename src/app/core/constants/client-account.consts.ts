import { AbstractControl, ValidationErrors } from '@angular/forms';
import { ClientStatusKey } from '../models/client-account.model';

export const MAX_STAGES = 10;
export const STATUS_KEYS: ClientStatusKey[] = ['Booked', 'Won', 'Cancelled'];
export const AD_ACCOUNT_ID_PATTERN = /^act_\d+$/;

export const DEFAULT_STAGES = [
  'New Leads',
  'Hot Leads - Reactivated',
  'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7',
  'In Progress',
  'Booked Appointment',
  'Failed to Attend',
  'Post-Consult Follow Up',
  'Automated Post-Consult Follow Up',
];

export function adAccountIdValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value?.trim();
  if (!val) return null;
  return AD_ACCOUNT_ID_PATTERN.test(val) ? null : { adAccountIdFormat: true };
}
