/** Typography scale for Fundi Wangu */
export const typography = {
  fontFamily: {
    /** System font stack — optimized for low-end devices */
    sans: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace',
  },

  fontSize: {
    xs: 10,
    sm: 12,
    caption: 12,
    body_sm: 14,
    body: 16,
    heading_m: 18,
    heading_l: 20,
    heading_xl: 24,
    heading_2xl: 28,
    heading_3xl: 32,
    display: 40,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;
