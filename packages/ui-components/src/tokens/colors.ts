/** Fundi Wangu brand color palette */
export const colors = {
  /** Brand primary — buttons, online status, confirm actions */
  primary: '#00875A',
  /** Darker primary — pressed states, headings */
  primaryDark: '#005C3D',
  /** Light primary for backgrounds and hover states */
  primaryLight: '#E6F5EE',

  /** Accent orange — urgent actions, accept job, new job alert */
  accent: '#FF6B35',
  accentDark: '#E55A25',
  accentLight: '#FFF0EA',

  /** Danger red — cancel, decline, error states */
  danger: '#E53E3E',
  dangerDark: '#C53030',
  dangerLight: '#FED7D7',

  /** Warning amber — pending states, warnings */
  warning: '#D97706',
  warningDark: '#B45309',
  warningLight: '#FEF3C7',

  /** Success green — completed, success toasts */
  success: '#38A169',
  successDark: '#276749',
  successLight: '#C6F6D5',

  /** Info blue — informational states */
  info: '#3182CE',
  infoDark: '#2C5282',
  infoLight: '#BEE3F8',

  /** Neutral palette */
  neutral900: '#111827',
  neutral800: '#1F2937',
  neutral700: '#374151',
  neutral600: '#4B5563',
  neutral500: '#6B7280',
  neutral400: '#9CA3AF',
  neutral300: '#D1D5DB',
  neutral200: '#E5E7EB',
  neutral100: '#F3F4F6',
  neutral50: '#F9FAFB',

  /** Base */
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  /** Semantic: job status colors */
  statusPending: '#D97706',
  statusAccepted: '#3182CE',
  statusEnRoute: '#805AD5',
  statusArrived: '#00875A',
  statusInProgress: '#DD6B20',
  statusCompleted: '#38A169',
  statusCancelled: '#E53E3E',
  statusDisputed: '#E53E3E',

  /** Verification tier colors */
  tierUnverified: '#9CA3AF',
  tierPhone: '#D97706',
  tierId: '#3182CE',
  tierCertified: '#00875A',

  /** Mobile money brand colors (for payment method selector) */
  mpesa: '#E60000',
  tigoPesa: '#004B87',
  airtelMoney: '#FF0000',
  halopesa: '#FF6600',
} as const;

export type ColorKey = keyof typeof colors;
