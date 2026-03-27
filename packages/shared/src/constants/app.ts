/** Supported languages */
export const SUPPORTED_LANGUAGES = ['en', 'ar'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Default pagination */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** JWT token durations */
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const STAFF_ACCESS_TOKEN_EXPIRY = '30m';
export const STAFF_REFRESH_TOKEN_EXPIRY = '24h';

/** Rate limiting */
export const AUTH_RATE_LIMIT_MAX = 5;
export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/** File upload limits */
export const MAX_VEHICLE_IMAGES = 10;
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const MAX_DOCUMENT_SIZE_MB = 10;
export const MAX_DOCUMENT_SIZE_BYTES = MAX_DOCUMENT_SIZE_MB * 1024 * 1024;

/** Address limits */
export const MAX_SAVED_ADDRESSES = 10;

/** OTP */
export const OTP_LENGTH = 6;
export const OTP_DEFAULT_EXPIRY_HOURS = 24;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const PHONE_OTP_EXPIRY_MINUTES = 5;

/** Password requirements */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
