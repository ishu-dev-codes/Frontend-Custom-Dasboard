export type ClientStatusKey = 'Booked' | 'Won' | 'Cancelled';

export interface PipelineStages {
  Booked?: string[];
  Won?: string[];
  Cancelled?: string[];
}

export interface MetaTokenResponse {
  token: string;
}

export interface ClientAccount {
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