export const ADMIN_EMAIL = "ssynthrun@gmail.com";

// One-way cryptographic SHA-256 hash of secret trigger keyword (no plaintext exposed in client bundles)
export const ADMIN_KEYWORD_SHA256 = "3da8f47291cf1f0ec6236d1a1b4baf4ecca78ddcc13b20dfbe5b0f0f21a49517";

export interface IpAttemptRecord {
  ip: string;
  attempts: number;
  bannedUntil: number | null; // timestamp ms
  lastAttemptAt: number;
  reason?: string;
}

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  targetUserId?: string;
  details: string;
  ip?: string;
}
