/** Bilingual notification templates for push and SMS delivery */
export const notificationTemplates = {
  JOB_CONFIRMED: {
    sw: {
      title: 'Kazi imethibitishwa',
      body: '{{fundiName}} amekubali kazi yako {{jobRef}}. Anakuja.',
    },
    en: {
      title: 'Job Confirmed',
      body: "{{fundiName}} has accepted job {{jobRef}}. They're on the way.",
    },
  },

  PAYMENT_RELEASED: {
    sw: {
      title: 'Malipo yametolewa',
      body: 'TZS {{amount}} imetumwa kwenye pochi yako.',
    },
    en: {
      title: 'Payment Released',
      body: 'TZS {{amount}} has been sent to your wallet.',
    },
  },

  JOB_REQUEST: {
    sw: {
      title: 'Kazi Mpya!',
      body: '{{category}} - {{distance}}km mbali. TZS {{amount}} ya kukadiriwa.',
    },
    en: {
      title: 'New Job!',
      body: '{{category}} - {{distance}}km away. Est. TZS {{amount}}.',
    },
  },

  FUNDI_EN_ROUTE: {
    sw: {
      title: 'Fundi Anakuja',
      body: '{{fundiName}} yuko njiani. Anatarajiwa kufika dakika {{eta}}.',
    },
    en: {
      title: 'Fundi En Route',
      body: '{{fundiName}} is on the way. ETA {{eta}} minutes.',
    },
  },

  FUNDI_ARRIVED: {
    sw: {
      title: 'Fundi Amefika',
      body: '{{fundiName}} amefika eneo lako.',
    },
    en: {
      title: 'Fundi Arrived',
      body: '{{fundiName}} has arrived at your location.',
    },
  },

  JOB_COMPLETED: {
    sw: {
      title: 'Kazi Imekamilika',
      body: 'Kazi {{jobRef}} imekamilika. Tafadhali tathmini fundi wako.',
    },
    en: {
      title: 'Job Completed',
      body: 'Job {{jobRef}} is complete. Please rate your fundi.',
    },
  },

  DISPUTE_OPENED: {
    sw: {
      title: 'Malalamiko Yamefunguliwa',
      body: 'Kesi ya kazi {{jobRef}} inapitiwa. Tafadhali toa ushahidi wako.',
    },
    en: {
      title: 'Dispute Opened',
      body: 'Job {{jobRef}} is under review. Please submit your evidence.',
    },
  },

  DISPUTE_RESOLVED: {
    sw: {
      title: 'Malalamiko Yametatuliwa',
      body: 'Kesi ya kazi {{jobRef}} imetatuliwa.',
    },
    en: {
      title: 'Dispute Resolved',
      body: 'The dispute for job {{jobRef}} has been resolved.',
    },
  },

  PAYOUT_COMPLETED: {
    sw: {
      title: 'Malipo Yametumwa',
      body: 'TZS {{amount}} imetumwa kwa {{network}} yako.',
    },
    en: {
      title: 'Payout Sent',
      body: 'TZS {{amount}} has been sent to your {{network}}.',
    },
  },

  PAYOUT_FAILED: {
    sw: {
      title: 'Malipo Yameshindwa',
      body: 'Malipo ya TZS {{amount}} yameshindwa. Tafadhali jaribu tena.',
    },
    en: {
      title: 'Payout Failed',
      body: 'Payout of TZS {{amount}} failed. Please try again.',
    },
  },

  VERIFICATION_APPROVED: {
    sw: {
      title: 'Uthibitisho Umekubaliwa',
      body: 'Kitambulisho chako kimethibitishwa. Sasa unaweza kwenda mtandaoni!',
    },
    en: {
      title: 'Verification Approved',
      body: 'Your ID has been verified. You can now go online!',
    },
  },

  VERIFICATION_REJECTED: {
    sw: {
      title: 'Uthibitisho Umekataliwa',
      body: 'Kitambulisho chako hakikukubaliwa. Tafadhali pakia tena.',
    },
    en: {
      title: 'Verification Rejected',
      body: 'Your ID verification was not approved. Please re-upload.',
    },
  },

  JOB_CANCELLED: {
    sw: {
      title: 'Kazi Imeghairiwa',
      body: 'Kazi {{jobRef}} imeghairiwa.',
    },
    en: {
      title: 'Job Cancelled',
      body: 'Job {{jobRef}} has been cancelled.',
    },
  },

  NEW_REVIEW: {
    sw: {
      title: 'Tathmini Mpya',
      body: 'Umepata tathmini mpya ya nyota {{rating}} kutoka kwa {{customerName}}.',
    },
    en: {
      title: 'New Review',
      body: 'You received a {{rating}}-star review from {{customerName}}.',
    },
  },

  ESCROW_RELEASING: {
    sw: {
      title: 'Malipo Yanatolewa',
      body: 'Malipo ya kazi {{jobRef}} yanatolewa baada ya saa 24.',
    },
    en: {
      title: 'Escrow Releasing',
      body: 'Payment for job {{jobRef}} will be released after 24 hours.',
    },
  },

  PANIC_ALERT: {
    sw: {
      title: 'TAARIFA YA DHARURA',
      body: 'Mteja {{customerName}} ametuma taarifa ya dharura kwa kazi {{jobRef}}.',
    },
    en: {
      title: 'EMERGENCY ALERT',
      body: 'Customer {{customerName}} has triggered an emergency alert for job {{jobRef}}.',
    },
  },
} as const;

export type NotificationTemplateKey = keyof typeof notificationTemplates;
