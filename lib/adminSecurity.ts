import crypto from "crypto";
import {
  ADMIN_EMAIL,
  ADMIN_KEYWORD_SHA256,
  IpAttemptRecord,
  AdminAuditEntry,
} from "@/lib/adminConstants";

export {
  ADMIN_EMAIL,
  ADMIN_KEYWORD_SHA256,
  type IpAttemptRecord,
  type AdminAuditEntry,
};

// Server-only environment secrets
const SERVER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Synthetic!@1029";
const SERVER_ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  "a17c35a90a66a6bfcda62255e2601dc6ee998c93ec7674dcf4c63ee5632c464f";
const SERVER_ADMIN_KEYWORD = process.env.ADMIN_KEYWORD || "cheesepasta";
const SERVER_ADMIN_KEYWORD_HASH =
  process.env.ADMIN_KEYWORD_HASH ||
  "3da8f47291cf1f0ec6236d1a1b4baf4ecca78ddcc13b20dfbe5b0f0f21a49517";

const MAGIC_SECRET =
  process.env.ADMIN_MAGIC_SECRET ||
  process.env.ENTITLEMENT_SECRET ||
  "cf-admin-supersecret-magic-token-key-2026-strict";

// Global server-side registry (survives hot reloads via globalThis)
const globalRegistry = globalThis as unknown as {
  __CF_IP_REGISTRY__?: Map<string, IpAttemptRecord>;
  __CF_AUDIT_LOGS__?: AdminAuditEntry[];
};

if (!globalRegistry.__CF_IP_REGISTRY__) {
  globalRegistry.__CF_IP_REGISTRY__ = new Map<string, IpAttemptRecord>();
}

if (!globalRegistry.__CF_AUDIT_LOGS__) {
  globalRegistry.__CF_AUDIT_LOGS__ = [
    {
      id: "init-1",
      timestamp: new Date().toISOString(),
      adminEmail: ADMIN_EMAIL,
      action: "SYSTEM_INITIALIZE",
      details: "Admin security gateway initialized and monitoring active.",
    },
  ];
}

const ipRegistry = globalRegistry.__CF_IP_REGISTRY__;
const auditLogs = globalRegistry.__CF_AUDIT_LOGS__;

// Helper to extract IP from request headers
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Check if an IP address is currently banned
 */
export function checkIpBanStatus(ip: string): {
  isBanned: boolean;
  remainingSeconds: number;
  attempts: number;
} {
  const rec = ipRegistry.get(ip);
  if (!rec) {
    return { isBanned: false, remainingSeconds: 0, attempts: 0 };
  }

  const now = Date.now();
  if (rec.bannedUntil && rec.bannedUntil > now) {
    const remainingMs = rec.bannedUntil - now;
    return {
      isBanned: true,
      remainingSeconds: Math.ceil(remainingMs / 1000),
      attempts: rec.attempts,
    };
  }

  // Ban expired
  if (rec.bannedUntil && rec.bannedUntil <= now) {
    rec.bannedUntil = null;
    rec.attempts = 0;
    ipRegistry.set(ip, rec);
  }

  return {
    isBanned: false,
    remainingSeconds: 0,
    attempts: rec.attempts,
  };
}

/**
 * Record a failed admin password attempt
 */
export function recordFailedAttempt(
  ip: string,
  reason = "Failed admin password verification"
): {
  isBanned: boolean;
  attemptsLeft: number;
  totalAttempts: number;
  remainingSeconds: number;
} {
  const now = Date.now();
  const current = ipRegistry.get(ip) || {
    ip,
    attempts: 0,
    bannedUntil: null,
    lastAttemptAt: now,
  };

  current.attempts += 1;
  current.lastAttemptAt = now;
  current.reason = reason;

  if (current.attempts >= 3) {
    // 30 minutes lockout
    const BAN_DURATION_MS = 30 * 60 * 1000;
    current.bannedUntil = now + BAN_DURATION_MS;
    ipRegistry.set(ip, current);

    logAdminAudit({
      adminEmail: "SECURITY_AUTOMATION",
      action: "IP_BANNED_30_MIN",
      details: `IP ${ip} banned for 30 minutes after 3 consecutive failed password attempts.`,
      ip,
    });

    return {
      isBanned: true,
      attemptsLeft: 0,
      totalAttempts: current.attempts,
      remainingSeconds: 1800,
    };
  }

  ipRegistry.set(ip, current);
  return {
    isBanned: false,
    attemptsLeft: Math.max(0, 3 - current.attempts),
    totalAttempts: current.attempts,
    remainingSeconds: 0,
  };
}

/**
 * Reset failed attempts on successful login
 */
export function recordSuccessfulLogin(ip: string): void {
  const rec = ipRegistry.get(ip);
  if (rec) {
    rec.attempts = 0;
    rec.bannedUntil = null;
    ipRegistry.set(ip, rec);
  }
}

/**
 * Manually unban an IP
 */
export function unbanIp(ip: string): boolean {
  const rec = ipRegistry.get(ip);
  if (rec) {
    rec.attempts = 0;
    rec.bannedUntil = null;
    ipRegistry.set(ip, rec);
    return true;
  }
  return false;
}

/**
 * Manually ban an IP
 */
export function banIpManually(
  ip: string,
  durationMinutes = 30,
  reason = "Manually banned by root admin"
): void {
  const now = Date.now();
  const rec = ipRegistry.get(ip) || {
    ip,
    attempts: 3,
    bannedUntil: null,
    lastAttemptAt: now,
  };

  rec.bannedUntil = now + durationMinutes * 60 * 1000;
  rec.reason = reason;
  ipRegistry.set(ip, rec);
}

/**
 * Get all active IP bans and attempt logs
 */
export function getAllBans(): IpAttemptRecord[] {
  const now = Date.now();
  const list: IpAttemptRecord[] = [];
  Array.from(ipRegistry.values()).forEach((rec) => {
    if (rec.bannedUntil && rec.bannedUntil > now) {
      list.push({ ...rec });
    } else if (rec.attempts > 0) {
      list.push({ ...rec });
    }
  });
  return list;
}

/**
 * Server-side encrypted constant-time password verification
 */
export function verifyAdminPassword(candidate: string): boolean {
  if (typeof candidate !== "string" || !candidate) return false;

  // 1. Direct constant-time comparison with server environment variable
  const a = Buffer.from(candidate, "utf8");
  const b = Buffer.from(SERVER_ADMIN_PASSWORD, "utf8");
  let directMatch = false;
  if (a.length === b.length) {
    directMatch = crypto.timingSafeEqual(a, b);
  }

  // 2. SHA-256 hash comparison against server hash
  const candHash = crypto.createHash("sha256").update(candidate).digest("hex");
  const hashA = Buffer.from(candHash, "utf8");
  const hashB = Buffer.from(SERVER_ADMIN_PASSWORD_HASH, "utf8");
  let hashMatch = false;
  if (hashA.length === hashB.length) {
    hashMatch = crypto.timingSafeEqual(hashA, hashB);
  }

  return directMatch || hashMatch;
}

/**
 * Server-side trigger keyword verification
 */
export function verifyAdminKeyword(candidate: string): boolean {
  if (typeof candidate !== "string" || !candidate) return false;
  const candHash = crypto.createHash("sha256").update(candidate.toLowerCase().trim()).digest("hex");
  return candHash === SERVER_ADMIN_KEYWORD_HASH || candidate.toLowerCase().trim() === SERVER_ADMIN_KEYWORD.toLowerCase().trim();
}

// ----------------------------------------------------------------------------
// 10-Minute Rotating Magic Link Token System
// Window period: 10 minutes (600,000 ms)
// ----------------------------------------------------------------------------
export const MAGIC_WINDOW_MS = 10 * 60 * 1000; // 10 mins

/**
 * Calculate the current 10-minute epoch window number
 */
export function getMagicWindow(offsetMinutes = 0): number {
  const now = Date.now() + offsetMinutes * 60 * 1000;
  return Math.floor(now / MAGIC_WINDOW_MS);
}

/**
 * Generate a 10-minute magic token for an email in a specific window
 */
export function generateAdminMagicToken(
  email = ADMIN_EMAIL,
  windowIndex = getMagicWindow()
): string {
  const payload = `CF_ADMIN:${email.toLowerCase().trim()}:${windowIndex}`;
  const hmac = crypto
    .createHmac("sha256", MAGIC_SECRET)
    .update(payload)
    .digest("hex");
  // URL-safe clean format: adm_<first 24 chars>
  return `adm_${hmac.slice(0, 24)}`;
}

/**
 * Validate a magic token
 * Allows current 10-min window, and previous window within a 60s grace margin
 */
export function verifyAdminMagicToken(
  token: string,
  email = ADMIN_EMAIL
): {
  valid: boolean;
  expiresAt: number;
  remainingSeconds: number;
} {
  if (!token || typeof token !== "string" || !token.startsWith("adm_")) {
    return { valid: false, expiresAt: 0, remainingSeconds: 0 };
  }

  const currentWindow = getMagicWindow();
  const currentToken = generateAdminMagicToken(email, currentWindow);

  const windowStartMs = currentWindow * MAGIC_WINDOW_MS;
  const expiresAt = windowStartMs + MAGIC_WINDOW_MS;
  const remainingSeconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));

  if (token === currentToken) {
    return { valid: true, expiresAt, remainingSeconds };
  }

  // Grace window: previous 10-minute slice
  const prevWindow = currentWindow - 1;
  const prevToken = generateAdminMagicToken(email, prevWindow);
  if (token === prevToken) {
    return { valid: true, expiresAt, remainingSeconds: Math.min(60, remainingSeconds) };
  }

  return { valid: false, expiresAt: 0, remainingSeconds: 0 };
}

/**
 * Return the current valid magic path and expiration time
 */
export function getCurrentMagicPath(email = ADMIN_EMAIL): {
  token: string;
  path: string;
  expiresAt: number;
  remainingSeconds: number;
} {
  const windowIndex = getMagicWindow();
  const token = generateAdminMagicToken(email, windowIndex);
  const windowStartMs = windowIndex * MAGIC_WINDOW_MS;
  const expiresAt = windowStartMs + MAGIC_WINDOW_MS;
  const remainingSeconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));

  return {
    token,
    path: `/admin/${token}`,
    expiresAt,
    remainingSeconds,
  };
}

/**
 * Operational audit logger
 */
export function logAdminAudit(entry: Omit<AdminAuditEntry, "id" | "timestamp">): void {
  const item: AdminAuditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  auditLogs.unshift(item);
  if (auditLogs.length > 200) {
    auditLogs.pop();
  }
}

/**
 * Retrieve audit log items
 */
export function getAdminAuditLogs(limit = 100): AdminAuditEntry[] {
  return auditLogs.slice(0, limit);
}
