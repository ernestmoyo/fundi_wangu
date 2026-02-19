/** Shared component prop types used across mobile and web */

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type InputState = 'default' | 'focused' | 'error' | 'disabled';

export type JobStatusColor = {
  bg: string;
  text: string;
  label_sw: string;
  label_en: string;
};

/** Maps each job status to its visual representation */
export const JOB_STATUS_DISPLAY: Record<string, JobStatusColor> = {
  pending: { bg: '#FEF3C7', text: '#D97706', label_sw: 'Inasubiri', label_en: 'Pending' },
  accepted: { bg: '#BEE3F8', text: '#3182CE', label_sw: 'Imekubaliwa', label_en: 'Accepted' },
  en_route: { bg: '#E9D5FF', text: '#805AD5', label_sw: 'Njiani', label_en: 'En Route' },
  arrived: { bg: '#E6F5EE', text: '#00875A', label_sw: 'Amefika', label_en: 'Arrived' },
  in_progress: { bg: '#FED7AA', text: '#DD6B20', label_sw: 'Inaendelea', label_en: 'In Progress' },
  completed: { bg: '#C6F6D5', text: '#38A169', label_sw: 'Imekamilika', label_en: 'Completed' },
  cancelled: { bg: '#FED7D7', text: '#E53E3E', label_sw: 'Imeghairiwa', label_en: 'Cancelled' },
  disputed: { bg: '#FED7D7', text: '#E53E3E', label_sw: 'Malalamiko', label_en: 'Disputed' },
};

/** Verification tier display */
export const TIER_DISPLAY: Record<string, { color: string; label_sw: string; label_en: string }> = {
  unverified: { color: '#9CA3AF', label_sw: 'Hajathibitishwa', label_en: 'Unverified' },
  tier1_phone: { color: '#D97706', label_sw: 'Simu', label_en: 'Phone Verified' },
  tier2_id: { color: '#3182CE', label_sw: 'Kitambulisho', label_en: 'ID Verified' },
  tier3_certified: { color: '#00875A', label_sw: 'Mtaalamu', label_en: 'Certified' },
};
