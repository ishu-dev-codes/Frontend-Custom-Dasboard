export const STORAGE_KEYS = {
  LOCATION_ID: 'location_id',
  AD_ACCOUNT_ID: 'ad_account_id',
};

export type ColumnDef = { header: string; field: string; extractor?: (v: any) => string };
