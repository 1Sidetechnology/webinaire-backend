import dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

/**
 * Validation et export des variables d'environnement
 * Cette approche garantit que toutes les variables nécessaires sont définies
 */

interface EnvConfig {
  // Application
  NODE_ENV: string;
  PORT: number;
  API_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;

  // SumUp
  SUMUP_API_KEY: string;
  SUMUP_MERCHANT_CODE: string;
  SUMUP_API_URL: string;
  SUMUP_WEBHOOK_SECRET: string;

  // Google
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  GOOGLE_REFRESH_TOKEN: string;
  GOOGLE_CALENDAR_ID: string;

  // SMTP
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SMTP_FROM_NAME: string;
  SMTP_FROM_EMAIL: string;

  // Company
  COMPANY_NAME: string;
  COMPANY_ADDRESS: string;
  COMPANY_SIRET: string;
  COMPANY_VAT: string;
}

function getEnvVariable(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Variable d'environnement manquante: ${key}`);
  }
  return value ? parseInt(value, 10) : defaultValue!;
}

function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === "true";
}

export const env: EnvConfig = {
  // Application
  NODE_ENV: getEnvVariable("NODE_ENV", "development"),
  PORT: getEnvNumber("PORT", 3000),
  API_URL: getEnvVariable("API_URL", "http://localhost:3000"),

  // JWT
  JWT_SECRET: getEnvVariable("JWT_SECRET"),
  JWT_EXPIRES_IN: getEnvVariable("JWT_EXPIRES_IN", "7d"),

  // Supabase
  SUPABASE_URL: getEnvVariable("SUPABASE_URL"),
  SUPABASE_ANON_KEY: getEnvVariable("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_KEY: getEnvVariable("SUPABASE_SERVICE_KEY"),

  // SumUp
  SUMUP_API_KEY: getEnvVariable("SUMUP_API_KEY"),
  SUMUP_MERCHANT_CODE: getEnvVariable("SUMUP_MERCHANT_CODE"),
  SUMUP_API_URL: getEnvVariable("SUMUP_API_URL", "https://api.sumup.com/v0.1"),
  SUMUP_WEBHOOK_SECRET: getEnvVariable("SUMUP_WEBHOOK_SECRET"),

  // Google
  GOOGLE_CLIENT_ID: getEnvVariable("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: getEnvVariable("GOOGLE_CLIENT_SECRET"),
  GOOGLE_REDIRECT_URI: getEnvVariable("GOOGLE_REDIRECT_URI"),
  GOOGLE_REFRESH_TOKEN: getEnvVariable("GOOGLE_REFRESH_TOKEN"),
  GOOGLE_CALENDAR_ID: getEnvVariable("GOOGLE_CALENDAR_ID", "primary"),

  // SMTP
  SMTP_HOST: getEnvVariable("SMTP_HOST"),
  SMTP_PORT: getEnvNumber("SMTP_PORT", 587),
  SMTP_SECURE: getEnvBoolean("SMTP_SECURE", false),
  SMTP_USER: getEnvVariable("SMTP_USER"),
  SMTP_PASSWORD: getEnvVariable("SMTP_PASSWORD"),
  SMTP_FROM_NAME: getEnvVariable("SMTP_FROM_NAME"),
  SMTP_FROM_EMAIL: getEnvVariable("SMTP_FROM_EMAIL"),

  // Company
  COMPANY_NAME: getEnvVariable("COMPANY_NAME"),
  COMPANY_ADDRESS: getEnvVariable("COMPANY_ADDRESS"),
  COMPANY_SIRET: getEnvVariable("COMPANY_SIRET"),
  COMPANY_VAT: getEnvVariable("COMPANY_VAT"),
};

export default env;
