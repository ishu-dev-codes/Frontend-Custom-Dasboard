import { ColumnDef } from '../shared/constants/common.consts';

export const COMMON_COLUMN_DEFS: ColumnDef[] = [
  { header: 'Opportunity Name', field: 'name' },
  { header: 'Contact Name', field: 'contact', extractor: (v) => v?.name ?? '' },
  { header: 'Phone number', field: 'contact', extractor: (v) => v?.phone ?? '' },
  { header: 'Lead Value', field: 'monetaryValue' },
  { header: 'Pipeline Stage', field: 'pipelineStage' },
  { header: 'Status', field: 'status' },
  {
    header: 'Created At',
    field: 'createdAt',
    extractor: (v) =>
      v
        ? new Date(v).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          })
        : '',
  },
  {
    header: 'Tags',
    field: 'tags',
    extractor: (v) => (Array.isArray(v) ? v.join(', ') : (v ?? '')),
  },
  { header: 'Days in Stage', field: 'daysInStage' },
  { header: 'UTM Campaign (First)', field: 'attribution', extractor: (v) => v?.campaign ?? '' },
  { header: 'UTM Medium (First)', field: 'attribution', extractor: (v) => v?.medium ?? '' },
  { header: 'UTM Content (First)', field: 'attribution', extractor: (v) => v?.content ?? '' },
  { header: 'UTM Source (First)', field: 'attribution', extractor: (v) => v?.source ?? '' },
];

const META_CAMPAIGN_COLUMN_DEFS: ColumnDef[] = [
  { header: 'Campaign Name', field: 'campaign_name' },
  { header: 'Spend', field: 'spend' },
  { header: 'Impressions', field: 'impressions' },
  { header: 'Clicks', field: 'clicks' },
  { header: 'CTR', field: 'ctr' },
  { header: 'CPC', field: 'cpc' },
];

const LEADS_WON_COLUMN_DEFS: ColumnDef[] = [
  { header: 'Opportunity Name', field: 'name' },
  { header: 'Contact Name', field: 'contact', extractor: (v) => v?.name ?? '' },
  { header: 'Phone number', field: 'contact', extractor: (v) => v?.phone ?? '' },
  { header: 'Lead Value', field: 'monetaryValue' },
  { header: 'Pipeline Stage', field: 'pipelineStage' },
  { header: 'Status', field: 'status' },
  {
    header: 'Created At',
    field: 'createdAt',
    extractor: (v) =>
      v
        ? new Date(v).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          })
        : '',
  },
  {
    header: 'Tags',
    field: 'tags',
    extractor: (v) => (Array.isArray(v) ? v.join(', ') : (v ?? '')),
  },
  { header: 'Days in Stage', field: 'daysInStage' },
  { header: 'Days Since Won', field: 'daysSinceWon' },
  { header: 'UTM Campaign (First)', field: 'attribution', extractor: (v) => v?.campaign ?? '' },
  { header: 'UTM Medium (First)', field: 'attribution', extractor: (v) => v?.medium ?? '' },
  { header: 'UTM Content (First)', field: 'attribution', extractor: (v) => v?.content ?? '' },
  { header: 'UTM Source (First)', field: 'attribution', extractor: (v) => v?.source ?? '' },
];

export const CARD_COLUMN_DEFS: Record<string, ColumnDef[]> = {
  totalLeads: COMMON_COLUMN_DEFS,
  leadsAbandoned: COMMON_COLUMN_DEFS,
  leadsBooked: COMMON_COLUMN_DEFS,
  treatmentAccepted: COMMON_COLUMN_DEFS,
  opportunityPipeline: COMMON_COLUMN_DEFS,
  leadsWon: LEADS_WON_COLUMN_DEFS,
  leadsFta: COMMON_COLUMN_DEFS,
  totalAdSpend: META_CAMPAIGN_COLUMN_DEFS,
};

export const CARD_FALLBACK_TITLES: Record<string, string> = {
  totalLeads: '# Total SBX Leads',
  leadsAbandoned: '# Leads Abandoned',
  leadsBooked: '# Leads Booked',
  treatmentAccepted: 'Treatment Accepted',
  opportunityPipeline: 'Opportunity Pipeline',
  leadsWon: '# Leads Won',
  leadsFta: '# Leads FTA',
  totalAdSpend: 'Total Ad Spend',
};
