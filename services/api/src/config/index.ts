import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_BASE_URL: z.string().default('http://localhost:3000'),
  WEB_BASE_URL: z.string().default('http://localhost:3001'),

  // Database
  DATABASE_URL: z
    .string()
    .default('postgresql://fundiwangu:local_dev_password@localhost:5432/fundiwangu'),
  DATABASE_SSL: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32).default('dev-access-secret-change-in-production-minimum-32'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32)
    .default('dev-refresh-secret-change-in-production-minimum-32'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),

  // Selcom Paytech
  SELCOM_API_KEY: z.string().default(''),
  SELCOM_API_SECRET: z.string().default(''),
  SELCOM_VENDOR_ID: z.string().default(''),
  SELCOM_WEBHOOK_SECRET: z.string().default(''),
  SELCOM_BASE_URL: z.string().default('https://apigw.selcommobile.com/v1'),

  // Africa's Talking
  AT_API_KEY: z.string().default(''),
  AT_USERNAME: z.string().default('sandbox'),
  AT_SENDER_ID: z.string().default('FUNDIWANGU'),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().default(''),
  FIREBASE_PRIVATE_KEY: z.string().default(''),
  FIREBASE_CLIENT_EMAIL: z.string().default(''),

  // Google Maps
  GOOGLE_MAPS_API_KEY: z.string().default(''),

  // S3 / R2
  S3_BUCKET_NAME: z.string().default(''),
  S3_REGION: z.string().default(''),
  S3_ACCESS_KEY_ID: z.string().default(''),
  S3_SECRET_ACCESS_KEY: z.string().default(''),
  S3_ENDPOINT: z.string().default(''),

  // Sentry
  SENTRY_DSN: z.string().default(''),

  // Encryption (AES-256 for NIN, payout numbers)
  ENCRYPTION_KEY: z.string().default('dev-encryption-key-change-in-prod!'),
  ENCRYPTION_IV: z.string().default('dev-iv-16chars!'),
});

function loadConfig() {
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    const message = Object.entries(formatted)
      .filter(([key]) => key !== '_errors')
      .map(([key, val]) => `  ${key}: ${JSON.stringify(val)}`)
      .join('\n');

    throw new Error(`Missing or invalid environment variables:\n${message}`);
  }

  return result.data;
}

export const config = loadConfig();
export type Config = z.infer<typeof configSchema>;
