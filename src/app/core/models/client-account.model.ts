import { AbstractControl, ValidationErrors } from "@angular/forms";

export type ClientStatusKey = 'Booked' | 'Won' | 'Cancelled';

export interface PipelineStages {
  Booked?: string[];
  Won?: string[];
  Cancelled?: string[];
}

export interface  ClientAccount {
  id: number;
  client_name: string;
  location_id: string;
  ad_account_id: string;
  ad_account_name: string;
  image_url?: string;
  pipeline_stages?: PipelineStages;
}

export interface ClientAccountPayload {
  client_name: string;
  location_id: string;
  ad_account_id?: string;
  ad_account_name?: string;
  token?: string;
  image_url?: string;
  pipeline_stages: {
    Booked: string[];
    Won: string[];
    Cancelled: string[];
  };
}

export const MAX_STAGES = 10;
export const STATUS_KEYS: ClientStatusKey[] = ['Booked', 'Won', 'Cancelled'];
export const AD_ACCOUNT_ID_PATTERN = /^act_\d+$/;

export function adAccountIdValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value?.trim();
  if (!val) return null; // optional field
  return AD_ACCOUNT_ID_PATTERN.test(val) ? null : { adAccountIdFormat: true };
}